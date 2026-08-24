import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getTransactionStatus } from "@/lib/pesapal/client";
import { decidePesapalOutcome } from "@/lib/pesapal/statusDecision";

// Pesapal IPN webhook. Unlike Flutterwave, Pesapal's IPN call carries no
// signature header and deliberately omits the payment status itself ("for
// security reasons" per their docs) — it only tells us *which* order to
// check. The actual trust boundary is that WE re-query GetTransactionStatus
// with our own authenticated (Bearer token) API call, so a forged IPN call
// with a guessed/wrong orderTrackingId can't mark anything paid — it can
// only make us ask Pesapal about an order, and Pesapal's real answer wins.
//
// NOTE: built against Pesapal's documented API 3.0 IPN contract but not
// tested against a live account — see lib/pesapal/client.ts for the same
// caveat.

function ackShape(orderTrackingId: string, merchantReference: string) {
  return {
    orderNotificationType: "IPNCHANGE",
    orderTrackingId,
    orderMerchantReference: merchantReference,
    status: 200,
  };
}

async function handle(req: NextRequest) {
  const url = req.nextUrl;
  let orderTrackingId = url.searchParams.get("OrderTrackingId") ?? url.searchParams.get("orderTrackingId");
  let merchantReference = url.searchParams.get("OrderMerchantReference") ?? url.searchParams.get("orderMerchantReference");

  if (!orderTrackingId) {
    try {
      const body = await req.json();
      orderTrackingId = body?.OrderTrackingId ?? body?.orderTrackingId ?? null;
      merchantReference = merchantReference ?? body?.OrderMerchantReference ?? body?.orderMerchantReference ?? null;
    } catch {
      // no JSON body — fine, query params were the primary channel
    }
  }

  if (!orderTrackingId) {
    return NextResponse.json({ error: "Missing OrderTrackingId" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, total")
    .eq("pesapal_order_tracking_id", orderTrackingId)
    .maybeSingle();

  if (!order) {
    // Nothing to reconcile against — still ack so Pesapal stops retrying.
    return NextResponse.json(ackShape(orderTrackingId, merchantReference ?? ""));
  }

  // Idempotency: if already resolved, ack and stop.
  if (order.status !== "pending_payment") {
    return NextResponse.json(ackShape(orderTrackingId, merchantReference ?? ""));
  }

  let status;
  try {
    status = await getTransactionStatus(orderTrackingId);
  } catch {
    // Transient failure talking to Pesapal — ack anyway so they don't spam
    // retries; the order stays pending_payment and the next IPN call (or the
    // customer landing back on /order-confirmed) will retry the lookup.
    return NextResponse.json(ackShape(orderTrackingId, merchantReference ?? ""));
  }

  const outcome = decidePesapalOutcome(status, Number(order.total));

  if (outcome === "paid") {
    await supabase
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString(), payment_provider: "pesapal" })
      .eq("id", order.id);

    await supabase.from("notification_jobs").insert({
      order_id: order.id,
      job_type: "order_confirmation",
      status: "queued",
    });
  } else if (outcome === "failed") {
    // FAILED or REVERSED — restore reserved stock, same path as M-Pesa/Flutterwave.
    await supabase.from("orders").update({ status: "payment_failed" }).eq("id", order.id);

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("sku_id, quantity")
      .eq("order_id", order.id);

    for (const item of orderItems ?? []) {
      await supabase.rpc("increment_sku_stock", { p_sku_id: item.sku_id, p_delta: item.quantity });
      await supabase.from("inventory_log").insert({
        sku_id: item.sku_id, delta: item.quantity, reason: "payment_failed", reference: order.id,
      });
    }
  }
  // statusCode 0 (INVALID/pending) — leave as pending_payment, a later IPN
  // call or the cron's stale-reservation sweep will resolve it eventually.

  return NextResponse.json(ackShape(orderTrackingId, merchantReference ?? status.merchantReference));
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
