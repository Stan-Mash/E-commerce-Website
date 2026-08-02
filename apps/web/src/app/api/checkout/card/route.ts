import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { normaliseKenyanPhone, generateOrderRef } from "@/lib/utils";
import { deliveryFeeFor, requiresAddress, normaliseDeliveryType } from "@/lib/delivery";
import { submitOrderRequest, isPesapalConfigured } from "@/lib/pesapal/client";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
});

const Schema = z
  .object({
    phone: z.string().min(9).max(15),
    email: z.string().email().optional(),
    items: z
      .array(
        z.object({
          skuId: z.string().uuid(),
          quantity: z.number().int().positive().max(10),
        })
      )
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

/**
 * Card / multi-method checkout via Pesapal.
 * Creates the order (reserving stock atomically, same RPC as M-Pesa), then
 * returns a hosted Pesapal payment link. The order stays 'pending_payment'
 * until the Pesapal IPN webhook confirms it.
 */
export async function POST(req: NextRequest) {
  if (!isPesapalConfigured()) {
    return NextResponse.json(
      { error: "Card payment is not available yet. Please use M-Pesa." },
      { status: 503 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
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
    const price = (sku.product as { base_price: number } | null)?.base_price ?? 0;
    subtotal += price * item.quantity;
  }
  subtotal = Math.round(subtotal);
  const deliveryFee = deliveryFeeFor(deliveryType);
  const total = Math.round(subtotal + deliveryFee);

  const orderRef = generateOrderRef();
  const rpcItems = items.map((item) => {
    const sku = skus.find((s) => s.id === item.skuId)!;
    const price = (sku.product as { base_price: number } | null)?.base_price ?? 0;
    return { sku_id: item.skuId, quantity: item.quantity, unit_price: Math.round(price) };
  });

  const { data: rpcResult, error: rpcErr } = await supabase.rpc("checkout_and_reserve_stock", {
    p_order_ref:        orderRef,
    p_phone:            normalisedPhone,
    p_subtotal:         subtotal,
    p_delivery_fee:     deliveryFee,
    p_total:            total,
    p_delivery_type:    deliveryType,
    p_delivery_address: deliveryAddress ?? null,
    p_notes:            notes ?? null,
    p_items:            rpcItems,
  });

  if (rpcErr) {
    if (rpcErr.message.includes("Insufficient stock")) {
      return NextResponse.json({ error: "One or more items is out of stock" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const order = rpcResult as { order_id: string; order_ref: string };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

  try {
    const { redirectUrl, orderTrackingId } = await submitOrderRequest({
      orderRef,
      amount: total,
      description: `Elite Style Co. order ${orderRef}`,
      callbackUrl: `${siteUrl}/order-confirmed?ref=${encodeURIComponent(orderRef)}`,
      customerPhone: normalisedPhone,
      customerEmail: email,
    });

    // Record the pending payment intent + Pesapal's tracking ID for the IPN
    // webhook to look up (it only receives orderTrackingId, not our order id).
    await supabase
      .from("orders")
      .update({ payment_provider: "pesapal", pesapal_order_tracking_id: orderTrackingId })
      .eq("id", order.order_id);

    return NextResponse.json({ orderId: order.order_id, orderRef, paymentLink: redirectUrl, total });
  } catch {
    // Couldn't reach Pesapal - restore stock and mark failed.
    await supabase.from("orders").update({ status: "payment_failed" }).eq("id", order.order_id);
    for (const item of rpcItems) {
      await supabase.rpc("increment_sku_stock", { p_sku_id: item.sku_id, p_delta: item.quantity });
      await supabase.from("inventory_log").insert({
        sku_id: item.sku_id, delta: item.quantity, reason: "payment_failed", reference: order.order_id,
      });
    }
    return NextResponse.json({ error: "Could not start card payment. Please try again." }, { status: 502 });
  }
}
