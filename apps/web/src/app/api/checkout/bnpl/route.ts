import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { normaliseKenyanPhone, generateOrderRef } from "@/lib/utils";
import { deliveryFeeFor, requiresAddress, normaliseDeliveryType } from "@/lib/delivery";
import { isBNPLConfigured, buildBNPLLink } from "@/lib/bnpl";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const Schema = z
  .object({
    phone: z.string().min(9).max(15),
    email: z.string().email().optional(),
    items: z
      .array(z.object({ skuId: z.string().uuid(), quantity: z.number().int().positive().max(10) }))
      .min(1)
      .max(20),
    deliveryType: z.enum(["pickup", "cbd", "outside_cbd", "door"]),
    deliveryAddress: z.string().min(10).max(300).optional(),
    notes: z.string().max(200).optional(),
  })
  .refine(
    (d) => !requiresAddress(normaliseDeliveryType(d.deliveryType)) || !!d.deliveryAddress,
    { message: "A delivery address is required for deliveries.", path: ["deliveryAddress"] }
  );

// Instalment checkout: creates the order (same stock-reserving RPC), then
// redirects to the BNPL provider's hosted checkout. The order stays
// 'pending_payment' until payment is confirmed (manually or via the
// provider's notification once that account is live).
export async function POST(req: NextRequest) {
  if (!isBNPLConfigured()) {
    return NextResponse.json(
      { error: "Instalment payments aren't available yet." },
      { status: 503 }
    );
  }
  if (!(await rateLimit(`bnpl:${clientIp(req)}`, 10))) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { phone, email, items, deliveryAddress, notes } = parsed.data;
  const deliveryType = normaliseDeliveryType(parsed.data.deliveryType);

  let normalisedPhone: string;
  try {
    normalisedPhone = normaliseKenyanPhone(phone);
  } catch {
    return NextResponse.json({ error: "Invalid Kenyan phone number." }, { status: 422 });
  }

  const supabase = createAdminSupabaseClient();

  type SkuWithProduct = { id: string; stock_quantity: number; product: { name: string; base_price: number } | null };
  const skuIds = items.map((i) => i.skuId);
  const { data: rawSkus, error: skuErr } = await supabase
    .from("skus")
    .select("id, stock_quantity, product:products(name, base_price)")
    .in("id", skuIds);
  const skus = rawSkus as unknown as SkuWithProduct[] | null;

  if (skuErr || !skus || skus.length !== items.length) {
    return NextResponse.json({ error: "One or more items not found" }, { status: 404 });
  }

  let subtotal = 0;
  for (const item of items) {
    const sku = skus.find((s) => s.id === item.skuId)!;
    subtotal += (sku.product?.base_price ?? 0) * item.quantity;
  }
  subtotal = Math.round(subtotal);
  const deliveryFee = deliveryFeeFor(deliveryType);
  const total = Math.round(subtotal + deliveryFee);

  const orderRef = generateOrderRef();
  const rpcItems = items.map((item) => {
    const sku = skus.find((s) => s.id === item.skuId)!;
    return { sku_id: item.skuId, quantity: item.quantity, unit_price: Math.round(sku.product?.base_price ?? 0) };
  });

  const { data: rpcResult, error: rpcErr } = await supabase.rpc("checkout_and_reserve_stock", {
    p_order_ref:        orderRef,
    p_phone:            normalisedPhone,
    p_subtotal:         subtotal,
    p_delivery_fee:     deliveryFee,
    p_total:            total,
    p_delivery_type:    deliveryType,
    p_delivery_address: deliveryAddress ?? null,
    p_notes:            notes ? `${notes} [BNPL]` : "[BNPL]",
    p_items:            rpcItems,
  });

  if (rpcErr) {
    if (rpcErr.message.includes("Insufficient stock")) {
      return NextResponse.json({ error: "One or more items is out of stock" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const order = rpcResult as { order_id: string; order_ref: string };

  if (email) {
    const { error: emailErr } = await supabase.from("orders").update({ email }).eq("id", order.order_id);
    if (emailErr && !/column .* does not exist|could not find/i.test(emailErr.message)) {
      console.warn("[bnpl] email update warning:", emailErr.message);
    }
  }

  const paymentLink = buildBNPLLink(process.env.BNPL_PAYMENT_URL_TEMPLATE!, {
    amount: total,
    ref: orderRef,
    phone: normalisedPhone,
  });

  return NextResponse.json({ orderId: order.order_id, orderRef, paymentLink, total });
}
