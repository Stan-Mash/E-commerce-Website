import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/flutterwave/client";

/**
 * Flutterwave webhook. Flutterwave signs each call with a "verif-hash" header
 * equal to the secret hash you configure in the dashboard
 * (FLUTTERWAVE_WEBHOOK_HASH). We additionally re-verify the transaction
 * server-side before trusting the amount/status — never trust the payload alone.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("verif-hash");
  const expected = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  if (!expected || !signature || signature !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { data?: { id?: number; tx_ref?: string; status?: string; amount?: number } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const txId = body?.data?.id;
  const txRef = body?.data?.tx_ref;
  if (!txId || !txRef) {
    return NextResponse.json({ status: "ignored" });
  }

  const supabase = createAdminSupabaseClient();

  // Look up the order by ref (= tx_ref).
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, total")
    .eq("order_ref", txRef)
    .single();

  if (!order) {
    return NextResponse.json({ status: "order-not-found" });
  }

  // Idempotency: if already resolved, acknowledge and stop.
  const TERMINAL = ["paid", "processing", "ready_for_pickup", "shipped", "delivered", "payment_failed", "cancelled"];
  if (TERMINAL.includes(order.status) && order.status !== "pending_payment") {
    return NextResponse.json({ status: "already-processed" });
  }

  // Re-verify server-side.
  let verified;
  try {
    verified = await verifyTransaction(txId);
  } catch {
    return NextResponse.json({ status: "verify-failed" }, { status: 502 });
  }

  const amountOk = Math.round(verified.amount) >= Math.round(Number(order.total));
  const success = verified.status === "successful" && verified.currency === "KES" && amountOk;

  if (success) {
    await supabase
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString(), payment_provider: "flutterwave" })
      .eq("id", order.id);

    await supabase.from("notification_jobs").insert({
      order_id: order.id,
      job_type: "order_confirmation",
      status: "queued",
    });
  } else {
    await supabase.from("orders").update({ status: "payment_failed" }).eq("id", order.id);

    // Restore reserved stock.
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

  return NextResponse.json({ status: "ok" });
}
