import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { normaliseKenyanPhone, generateOrderRef } from "@/lib/utils";
import { applyDiscounts, type Promotion, type CartLineItem } from "@/lib/promotions/engine";
import { initiateSTKPush } from "@/lib/mpesa/daraja";

function checkAuth(request: NextRequest): boolean {
  const session = request.cookies.get("admin_session");
  return session?.value === "elite-admin-2024";
}

interface PosItem {
  sku_id:     string;
  quantity:   number;
  unit_price: number;
}

interface PosBody {
  phone:          string;
  payment_method: "cash" | "mpesa_stk" | "mpesa_c2b";
  location_id:    string;
  cashier_name:   string;
  items:          PosItem[];
  promo_code?:    string;
  notes?:         string;
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as PosBody;
  const { phone, payment_method, location_id, cashier_name, items, promo_code, notes } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items in order" }, { status: 400 });
  }
  if (!location_id) {
    return NextResponse.json({ error: "location_id is required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  // Normalise phone (allow empty — walk-in with no phone)
  let normalisedPhone = "";
  if (phone && phone.trim()) {
    try {
      normalisedPhone = normaliseKenyanPhone(phone);
    } catch {
      return NextResponse.json({ error: "Invalid Kenyan phone number" }, { status: 422 });
    }
  }

  // Fetch active promotions for discount calculation
  const { data: promoRows } = await supabase
    .from("promotions")
    .select("*")
    .eq("active", true);

  const promotions = (promoRows ?? []) as Promotion[];

  // Build cart lines with rounded prices
  const cartItems: CartLineItem[] = items.map((item) => ({
    sku_id:     item.sku_id,
    quantity:   item.quantity,
    unit_price: Math.round(item.unit_price),
  }));

  const { subtotal, discountAmount, total, appliedPromotion } = applyDiscounts(
    cartItems,
    0,           // no delivery fee for POS (always pickup)
    promotions,
    promo_code
  );

  const orderRef = `POS-${generateOrderRef()}`;

  // Call pos_checkout RPC — atomic stock check + order creation
  const rpcItems = cartItems.map((c) => ({
    sku_id:     c.sku_id,
    quantity:   c.quantity,
    unit_price: c.unit_price,
  }));

  const { data: rpcResult, error: rpcErr } = await supabase.rpc("pos_checkout", {
    p_order_ref:       orderRef,
    p_phone:           normalisedPhone || null,
    p_location_id:     location_id,
    p_payment_method:  payment_method,
    p_cashier_name:    cashier_name || "Staff",
    p_subtotal:        subtotal,
    p_discount_amount: discountAmount,
    p_total:           total,
    p_notes:           notes ?? null,
    p_items:           rpcItems,
  });

  if (rpcErr) {
    if (rpcErr.message.includes("Insufficient stock")) {
      return NextResponse.json({ error: "One or more items is out of stock at this location" }, { status: 409 });
    }
    if (rpcErr.message.includes("not found")) {
      return NextResponse.json({ error: "One or more items not found" }, { status: 404 });
    }
    console.error("[pos] RPC error:", rpcErr);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const order = rpcResult as { order_id: string; order_ref: string };

  // Redeem promotion usage counter
  if (appliedPromotion) {
    await supabase.rpc("redeem_promotion", { p_promotion_id: appliedPromotion.id });
    await supabase
      .from("orders")
      .update({ promotion_id: appliedPromotion.id })
      .eq("id", order.order_id);
  }

  // ── Payment-specific handling ──────────────────────────────────────────────

  if (payment_method === "cash") {
    // Cash: order already marked paid by RPC. Nothing else to do.
    return NextResponse.json({
      order_id:          order.order_id,
      order_ref:         orderRef,
      total,
      discount_amount:   discountAmount,
      applied_promotion: appliedPromotion?.name ?? null,
      payment_method:    "cash",
    }, { status: 201 });
  }

  if (payment_method === "mpesa_stk") {
    // STK Push: send payment prompt to customer's phone
    if (!normalisedPhone) {
      return NextResponse.json({ error: "Phone number required for M-Pesa STK Push" }, { status: 422 });
    }

    let stkResult;
    try {
      stkResult = await initiateSTKPush({
        phone:       normalisedPhone,
        amount:      total,
        orderId:     orderRef,
        description: "Elite Style Co — In-Store",
      });
    } catch (err) {
      // STK failed — restore stock (webhook won't fire)
      await supabase.from("orders").update({ status: "payment_failed" }).eq("id", order.order_id);
      for (const item of cartItems) {
        await supabase.rpc("increment_location_stock", {
          p_sku_id:      item.sku_id,
          p_location_id: location_id,
          p_delta:       item.quantity,
        });
        await supabase.from("inventory_log").insert({
          sku_id:    item.sku_id,
          delta:     item.quantity,
          reason:    "payment_failed",
          reference: order.order_id,
        });
      }
      console.error("[pos] STK Push error:", err);
      return NextResponse.json({ error: "M-Pesa payment initiation failed. Please try again." }, { status: 502 });
    }

    // Record transaction for webhook matching
    await supabase.from("mpesa_transactions").insert({
      order_id:            order.order_id,
      checkout_request_id: stkResult.CheckoutRequestID,
      merchant_request_id: stkResult.MerchantRequestID,
      amount:              total,
      phone_number:        normalisedPhone,
      status:              "pending",
    });

    return NextResponse.json({
      order_id:            order.order_id,
      order_ref:           orderRef,
      total,
      payment_method:      "mpesa_stk",
      checkout_request_id: stkResult.CheckoutRequestID,
      customer_message:    stkResult.CustomerMessage,
    }, { status: 201 });
  }

  if (payment_method === "mpesa_c2b") {
    // C2B: customer pays the Till. Create a c2b_payments row so the webhook
    // can match the incoming Safaricom callback to this order by order_ref.
    await supabase.from("c2b_payments").insert({
      order_id:        order.order_id,
      order_ref:       orderRef,
      expected_amount: total,
      status:          "pending",
    });

    return NextResponse.json({
      order_id:       order.order_id,
      order_ref:      orderRef,
      total,
      payment_method: "mpesa_c2b",
      // Cashier shows this ref to the customer — they enter it as Account Ref
      instruction: `Ask customer to pay KES ${total.toLocaleString()} to our Till and enter reference: ${orderRef}`,
    }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown payment method" }, { status: 400 });
}
