import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { initiateSTKPush } from "@/lib/mpesa/daraja";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { normaliseKenyanPhone, generateOrderRef } from "@/lib/utils";
import { deliveryFeeFor, requiresAddress, normaliseDeliveryType } from "@/lib/delivery";

/**
 * Rate limiting via Upstash Redis.
 * - Development without Redis: logs a warning and allows the request.
 * - Production without Redis: returns false (block) to prevent silent bypass.
 * - Production with Redis misconfigured: returns false (fail closed).
 */
async function checkRateLimit(ip: string): Promise<{ allowed: boolean; unavailable?: boolean }> {
  const isDev = process.env.NODE_ENV !== "production";
  const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  if (!hasRedis) {
    if (isDev) {
      console.warn("[checkout] Rate limiting disabled — UPSTASH_REDIS_REST_URL/TOKEN not set (dev only).");
      return { allowed: true };
    }
    // Production without Redis: service unavailable to prevent silent bypass.
    console.error("[checkout] Rate limiting required in production but UPSTASH env vars are missing.");
    return { allowed: false, unavailable: true };
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const rl = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
    });
    const { success } = await rl.limit(ip);
    return { allowed: success };
  } catch (err) {
    console.error("[checkout] Rate limit check threw:", (err as Error).message);
    if (isDev) return { allowed: true };
    return { allowed: false, unavailable: true };
  }
}

const CheckoutSchema = z
  .object({
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
    // "door" accepted for backwards compatibility; normalised to "outside_cbd".
    deliveryType: z.enum(["pickup", "cbd", "outside_cbd", "door"]),
    deliveryAddress: z.string().min(10).max(300).optional(),
    notes: z.string().max(200).optional(),
  })
  .refine(
    (data) =>
      !requiresAddress(normaliseDeliveryType(data.deliveryType)) ||
      !!data.deliveryAddress,
    {
      message: "A delivery address is required for deliveries.",
      path: ["deliveryAddress"],
    }
  );

export async function POST(req: NextRequest) {
  try {
    return await _handlePost(req);
  } catch (err) {
    console.error("[checkout] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function _handlePost(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Checkout is not available yet. Supabase is not configured." },
      { status: 503 }
    );
  }

  // Rate limit per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    if (rl.unavailable) {
      return NextResponse.json({ error: "Checkout is temporarily unavailable. Please try again shortly." }, { status: 503 });
    }
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

  const { phone, items, deliveryAddress, notes } = parsed.data;
  const deliveryType = normaliseDeliveryType(parsed.data.deliveryType);

  let normalisedPhone: string;
  try {
    normalisedPhone = normaliseKenyanPhone(phone);
  } catch {
    return NextResponse.json({ error: "Invalid Kenyan phone number. Use format 07XXXXXXXX or +2547XXXXXXXX" }, { status: 422 });
  }

  const supabase = createAdminSupabaseClient();

  type SkuWithProduct = { id: string; stock_quantity: number; product: { name: string; base_price: number } | null };

  // Fetch SKU prices (needed for total calculation before calling RPC)
  const skuIds = items.map((i) => i.skuId);
  let rawSkus: unknown, skuErr: unknown;
  try {
    ({ data: rawSkus, error: skuErr } = await supabase
      .from("skus")
      .select("id, stock_quantity, product:products(name, base_price)")
      .in("id", skuIds));
  } catch (e) {
    console.error("Supabase SKU fetch threw:", e);
    return NextResponse.json({ error: "Failed to fetch product data" }, { status: 503 });
  }
  const skus = rawSkus as unknown as SkuWithProduct[] | null;

  if (skuErr || !skus || skus.length !== items.length) {
    return NextResponse.json({ error: "One or more items not found" }, { status: 404 });
  }

  // Calculate total.
  // Math.round() is applied to every money value before it touches the database
  // or Daraja. Safaricom's STK Push API requires a strict integer — any decimal
  // (e.g. from a future percentage-based discount like 15% off KES 8,500 =
  // KES 7,225.50) would be silently truncated or rejected by the API.
  // Rounding here keeps financial records in Supabase perfectly aligned with
  // the amount Safaricom actually charges the customer.
  let subtotal = 0;
  for (const item of items) {
    const sku = skus.find((s) => s.id === item.skuId)!;
    const price = (sku.product as { base_price: number } | null)?.base_price ?? 0;
    subtotal += price * item.quantity;
  }
  subtotal = Math.round(subtotal);
  // Free within Nairobi CBD and for pickup; flat fee outside CBD.
  const deliveryFee = deliveryFeeFor(deliveryType);  // always a whole number
  const total = Math.round(subtotal + deliveryFee);

  // Build RPC payload — stock check, order creation, and stock decrement
  // happen atomically inside a single Postgres transaction with row locks.
  // This prevents overselling when two customers buy the last item simultaneously.
  const orderRef = generateOrderRef();
  const rpcItems = items.map((item) => {
    const sku = skus.find((s) => s.id === item.skuId)!;
    const price = (sku.product as { base_price: number } | null)?.base_price ?? 0;
    // Round unit_price so order_items.subtotal (unit_price × quantity) is also
    // a whole number — keeps the DB ledger consistent with the Daraja charge.
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
    // Postgres error codes set in the RPC
    if (rpcErr.message.includes("Insufficient stock")) {
      return NextResponse.json({ error: "One or more items is out of stock" }, { status: 409 });
    }
    if (rpcErr.message.includes("not found")) {
      return NextResponse.json({ error: "One or more items not found" }, { status: 404 });
    }
    console.error("checkout_and_reserve_stock RPC error:", rpcErr);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const order = rpcResult as { order_id: string; order_ref: string };

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
    // Daraja timed out, went down, or rejected the payload.
    // The webhook will NEVER fire in this case — Safaricom never accepted the
    // request — so we must restore stock here immediately.
    // (The webhook catch block handles the case where the customer cancels on
    // their phone; this catch block handles the case where we never reached
    // Safaricom at all.)
    await supabase
      .from("orders")
      .update({ status: "payment_failed" })
      .eq("id", order.order_id);

    for (const item of rpcItems) {
      await supabase.rpc("increment_sku_stock", {
        p_sku_id: item.sku_id,
        p_delta:  item.quantity,
      });

      await supabase.from("inventory_log").insert({
        sku_id:    item.sku_id,
        delta:     item.quantity,   // positive = stock returned
        reason:    "payment_failed",
        reference: order.order_id,
      });
    }

    console.error("STK Push error:", err);
    return NextResponse.json(
      { error: "M-Pesa payment initiation failed. Please try again." },
      { status: 502 }
    );
  }

  // Store mpesa transaction for idempotent callback matching
  await supabase.from("mpesa_transactions").insert({
    order_id: order.order_id,
    checkout_request_id: stkResult.CheckoutRequestID,
    merchant_request_id: stkResult.MerchantRequestID,
    amount: total,
    phone_number: normalisedPhone,
    status: "pending",
  });

  return NextResponse.json({
    orderId: order.order_id,
    orderRef,
    checkoutRequestId: stkResult.CheckoutRequestID,
    customerMessage: stkResult.CustomerMessage,
    total,
  });
}
