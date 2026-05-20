import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { initiateSTKPush } from "@/lib/mpesa/daraja";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { normaliseKenyanPhone, generateOrderRef } from "@/lib/utils";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
});

const CheckoutSchema = z.object({
  phone: z.string().min(9).max(15),
  items: z
    .array(
      z.object({
        skuId: z.string().uuid(),
        quantity: z.number().int().positive().max(10),
      })
    )
    .min(1)
    .max(20),
  deliveryType: z.enum(["pickup", "door"]),
  deliveryAddress: z.string().optional(),
  notes: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit per IP
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

  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { phone, items, deliveryType, deliveryAddress, notes } = parsed.data;

  let normalisedPhone: string;
  try {
    normalisedPhone = normaliseKenyanPhone(phone);
  } catch {
    return NextResponse.json({ error: "Invalid Kenyan phone number. Use format 07XXXXXXXX or +2547XXXXXXXX" }, { status: 422 });
  }

  const supabase = createAdminSupabaseClient();

  type SkuWithProduct = { id: string; stock_quantity: number; product: { name: string; base_price: number } | null };

  // Fetch SKU prices and validate stock
  const skuIds = items.map((i) => i.skuId);
  const { data: rawSkus, error: skuErr } = await supabase
    .from("skus")
    .select("id, stock_quantity, product:products(name, base_price)")
    .in("id", skuIds);
  const skus = rawSkus as unknown as SkuWithProduct[] | null;

  if (skuErr || !skus || skus.length !== items.length) {
    return NextResponse.json({ error: "One or more items not found" }, { status: 404 });
  }

  // Check stock
  for (const item of items) {
    const sku = skus.find((s) => s.id === item.skuId);
    if (!sku || sku.stock_quantity < item.quantity) {
      return NextResponse.json({ error: `Insufficient stock for item ${item.skuId}` }, { status: 409 });
    }
  }

  // Calculate total
  let subtotal = 0;
  for (const item of items) {
    const sku = skus.find((s) => s.id === item.skuId)!;
    const price = (sku.product as { base_price: number } | null)?.base_price ?? 0;
    subtotal += price * item.quantity;
  }
  const deliveryFee = deliveryType === "door" ? 250 : 0;
  const total = subtotal + deliveryFee;

  // Create order record (status: pending_payment)
  const orderRef = generateOrderRef();
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_ref: orderRef,
      status: "pending_payment",
      subtotal,
      delivery_fee: deliveryFee,
      total,
      delivery_type: deliveryType,
      delivery_address: deliveryAddress,
      phone: normalisedPhone,
      notes,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  // Create order items
  await supabase.from("order_items").insert(
    items.map((item) => {
      const sku = skus.find((s) => s.id === item.skuId)!;
      const price = (sku.product as { base_price: number } | null)?.base_price ?? 0;
      return {
        order_id: order.id,
        sku_id: item.skuId,
        quantity: item.quantity,
        unit_price: price,
        subtotal: price * item.quantity,
      };
    })
  );

  // Initiate M-Pesa STK Push
  let stkResult;
  try {
    stkResult = await initiateSTKPush({
      phone: normalisedPhone,
      amount: total,
      orderId: orderRef,
      description: "NairobiFashion Order",
    });
  } catch (err) {
    // STK push failed — mark order as payment_failed
    await supabase.from("orders").update({ status: "payment_failed" }).eq("id", order.id);
    console.error("STK Push error:", err);
    return NextResponse.json({ error: "M-Pesa payment initiation failed. Please try again." }, { status: 502 });
  }

  // Store mpesa transaction for idempotent callback matching
  await supabase.from("mpesa_transactions").insert({
    order_id: order.id,
    checkout_request_id: stkResult.CheckoutRequestID,
    merchant_request_id: stkResult.MerchantRequestID,
    amount: total,
    phone_number: normalisedPhone,
    status: "pending",
  });

  return NextResponse.json({
    orderId: order.id,
    orderRef,
    checkoutRequestId: stkResult.CheckoutRequestID,
    customerMessage: stkResult.CustomerMessage,
    total,
  });
}
