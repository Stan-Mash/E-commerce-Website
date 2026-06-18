import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { initiateSTKPush } from "@/lib/mpesa/daraja";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { normaliseKenyanPhone, generateOrderRef } from "@/lib/utils";
import { deliveryFeeFor, requiresAddress, normaliseDeliveryType } from "@/lib/delivery";
import { applyDiscounts, type Promotion } from "@/lib/promotions/engine";

// Rate limit via Upstash Redis. Allows requests in dev when Redis is absent;
// fails closed in production so a missing Redis can't silently bypass the limit.
async function checkRateLimit(ip: string): Promise<{ allowed: boolean; unavailable?: boolean }> {
  const isDev = process.env.NODE_ENV !== "production";
  const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  if (!hasRedis) {
    if (isDev) {
      console.warn("[checkout] Rate limiting disabled - UPSTASH env vars not set (dev only).");
      return { allowed: true };
    }
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
    promoCode: z.string().max(40).optional(),
    email: z.string().email().max(120).optional(),
    pickupPointId: z.string().uuid().optional(),
    // "stk" (default) pushes an M-Pesa prompt; "paybill" lets the customer pay
    // the paybill manually — no STK is sent, and the C2B webhook confirms it.
    paymentMethod: z.enum(["stk", "paybill"]).optional(),
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

  const { phone, items, notes, promoCode, email, pickupPointId } = parsed.data;
  let deliveryAddress = parsed.data.deliveryAddress;
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

  // Money is rounded to whole KES: Daraja requires integer amounts, and this
  // keeps the DB ledger aligned with what Safaricom charges.
  let subtotal = 0;
  for (const item of items) {
    const sku = skus.find((s) => s.id === item.skuId)!;
    const price = (sku.product as { base_price: number } | null)?.base_price ?? 0;
    subtotal += price * item.quantity;
  }
  subtotal = Math.round(subtotal);
  let baseDeliveryFee = deliveryFeeFor(deliveryType);

  // Pickup-point collection: the point's handling fee replaces the delivery
  // fee, and the point becomes the collection address.
  let pickupPoint: { id: string; name: string; area: string; fee: number } | null = null;
  if (deliveryType === "pickup" && pickupPointId) {
    const { data: pp } = await supabase
      .from("pickup_points")
      .select("id, name, area, fee, active")
      .eq("id", pickupPointId)
      .single();
    if (!pp || !pp.active) {
      return NextResponse.json({ error: "That pickup point is no longer available. Please choose another." }, { status: 422 });
    }
    pickupPoint = pp;
    baseDeliveryFee = Math.round(pp.fee);
    deliveryAddress = `Pickup point: ${pp.name}, ${pp.area}`;
  }

  // RPC does stock check, order creation, and decrement atomically (row locks).
  const orderRef = generateOrderRef();
  const rpcItems = items.map((item) => {
    const sku = skus.find((s) => s.id === item.skuId)!;
    const price = (sku.product as { base_price: number } | null)?.base_price ?? 0;
    return { sku_id: item.skuId, quantity: item.quantity, unit_price: Math.round(price) };
  });

  // Apply the best valid promotion (auto or code-entered). The engine returns
  // the discounted total; the unrecorded discount is simply reflected in `total`
  // so the customer is charged the right amount even before the ledger columns exist.
  const { data: promoRows } = await supabase
    .from("promotions")
    .select("*")
    .eq("active", true);
  const promotions = (promoRows ?? []) as Promotion[];
  const discount = applyDiscounts(rpcItems, baseDeliveryFee, promotions, promoCode);
  const deliveryFee = discount.deliveryFee;
  const total = discount.total;

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
    if (rpcErr.message.includes("not found")) {
      return NextResponse.json({ error: "One or more items not found" }, { status: 404 });
    }
    console.error("checkout_and_reserve_stock RPC error:", rpcErr);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const order = rpcResult as { order_id: string; order_ref: string };

  // Record email + discount ledger + pickup point (columns from migrations
  // 014/017). Best-effort: a missing column on an un-migrated DB must not
  // fail the checkout.
  if (email || discount.discountAmount > 0 || pickupPoint) {
    const ledger: Record<string, unknown> = {};
    if (email) ledger.email = email;
    if (pickupPoint) ledger.pickup_point_id = pickupPoint.id;
    if (discount.discountAmount > 0) {
      ledger.discount_amount = discount.discountAmount;
      if (discount.appliedPromotion) ledger.promotion_id = discount.appliedPromotion.id;
    }
    const { error: ledgerErr } = await supabase.from("orders").update(ledger).eq("id", order.order_id);
    if (ledgerErr && !/column .* does not exist|could not find/i.test(ledgerErr.message)) {
      console.warn("[checkout] order ledger update warning:", ledgerErr.message);
    }
  }

  // Manual paybill: no STK push. Register the expected payment so the C2B
  // webhook confirms the order when the customer pays with this reference.
  // (Previously this path still fired an STK prompt and the payment could
  // never be matched — web paybill orders sat unconfirmed forever.)
  if (parsed.data.paymentMethod === "paybill") {
    await supabase.from("c2b_payments").insert({
      order_id:        order.order_id,
      order_ref:       orderRef,
      expected_amount: total,
      status:          "pending",
    });

    if (discount.appliedPromotion) {
      await supabase.rpc("redeem_promotion", { p_promotion_id: discount.appliedPromotion.id });
    }

    return NextResponse.json({
      orderId: order.order_id,
      orderRef,
      total,
      subtotal: discount.subtotal,
      deliveryFee,
      discountAmount: discount.discountAmount,
      paymentMethod: "paybill",
    });
  }

  // Initiate M-Pesa STK Push
  let stkResult;
  try {
    stkResult = await initiateSTKPush({
      phone: normalisedPhone,
      amount: total,
      orderId: orderRef,
      description: "EliteStyle Order",
    });
  } catch (err) {
    // Safaricom never accepted the request, so the webhook won't fire.
    // Restore the stock the RPC reserved.
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

    const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string; code?: string };
    const darajaDetail = {
      responseStatus: axiosErr.response?.status,
      responseData:   axiosErr.response?.data,
      message:        axiosErr.message ?? String(err),
      code:           axiosErr.code,
    };
    console.error("STK Push error:", JSON.stringify(darajaDetail));
    return NextResponse.json(
      {
        error: "M-Pesa payment initiation failed. Please try again.",
        // Expose Daraja's exact error in sandbox only, to aid setup debugging.
        ...(process.env.MPESA_ENVIRONMENT !== "production" ? { detail: darajaDetail } : {}),
      },
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

  // Count the promotion usage (best-effort; uniqueness/caps enforced in the RPC).
  if (discount.appliedPromotion) {
    await supabase.rpc("redeem_promotion", { p_promotion_id: discount.appliedPromotion.id });
  }

  return NextResponse.json({
    orderId: order.order_id,
    orderRef,
    checkoutRequestId: stkResult.CheckoutRequestID,
    customerMessage: stkResult.CustomerMessage,
    total,
    subtotal: discount.subtotal,
    deliveryFee,
    discountAmount: discount.discountAmount,
    appliedPromotion: discount.appliedPromotion
      ? { code: discount.appliedPromotion.code, name: discount.appliedPromotion.name }
      : null,
  });
}
