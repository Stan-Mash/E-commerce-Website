/**
 * Safaricom Daraja C2B webhook handler.
 *
 * Register two URLs in the Daraja portal (Apps → C2B → Register URLs):
 *   Validation URL   : https://yourdomain.com/api/webhooks/mpesa/c2b?secret=MPESA_WEBHOOK_SECRET&type=validation
 *   Confirmation URL : https://yourdomain.com/api/webhooks/mpesa/c2b?secret=MPESA_WEBHOOK_SECRET&type=confirmation
 *
 * Flow:
 *   1. Cashier creates a C2B order via /api/admin/pos (returns order_ref).
 *   2. Cashier tells customer: "Pay KES X to our Till and enter <order_ref> as reference."
 *   3. Customer pays on their phone.
 *   4. Safaricom hits Validation URL (if registered) — we accept all.
 *   5. Safaricom hits Confirmation URL — we match BillRefNumber to c2b_payments,
 *      mark order as paid, and update via Supabase Realtime so the POS screen
 *      immediately shows "Payment Received" without polling.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const ACCEPTED  = { ResultCode: 0, ResultDesc: "Accepted" };
const REJECTED  = { ResultCode: 1, ResultDesc: "Rejected" };

function isAuthorised(req: NextRequest): boolean {
  const secret = req.nextUrl.searchParams.get("secret");
  return !!secret && secret === process.env.MPESA_WEBHOOK_SECRET;
}

export async function POST(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json(REJECTED, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get("type"); // "validation" | "confirmation"

  let body: Record<string, string>;
  try {
    body = (await req.json()) as Record<string, string>;
  } catch {
    return NextResponse.json(REJECTED, { status: 400 });
  }

  // Safaricom Validation: just accept so the transaction proceeds
  if (type === "validation") {
    return NextResponse.json(ACCEPTED);
  }

  // Safaricom Confirmation: match and settle
  const {
    BillRefNumber,   // = order_ref (cashier shows this to customer)
    TransAmount,     // "8500.00"
    MSISDN,         // customer phone
    TransID,        // Safaricom receipt number
  } = body;

  if (!BillRefNumber) {
    return NextResponse.json(ACCEPTED); // always 200 so Safaricom stops retrying
  }

  const supabase = createAdminSupabaseClient();

  const { data: pending } = await supabase
    .from("c2b_payments")
    .select("id, order_id, expected_amount, status")
    .eq("order_ref", BillRefNumber)
    .maybeSingle();

  if (!pending || pending.status !== "pending") {
    // Unknown order ref or already processed — accept silently
    return NextResponse.json(ACCEPTED);
  }

  const actualAmount   = parseFloat(TransAmount ?? "0");
  const expectedAmount = Number(pending.expected_amount);

  let matchStatus: "matched" | "overpaid" | "underpaid" =
    actualAmount >= expectedAmount ? "matched" : "underpaid";
  if (actualAmount > expectedAmount) matchStatus = "overpaid";

  // Update c2b_payments record
  await supabase
    .from("c2b_payments")
    .update({
      status:         matchStatus,
      actual_amount:  actualAmount,
      phone:          MSISDN,
      mpesa_receipt:  TransID,
    })
    .eq("id", pending.id);

  if (matchStatus === "matched" || matchStatus === "overpaid") {
    // Mark order paid — Supabase Realtime broadcasts this change to the POS page
    await supabase
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", pending.order_id);

    // Enqueue order-confirmation notification
    await supabase.from("notification_jobs").insert({
      order_id: pending.order_id,
      job_type: "order_confirmation",
      status:   "queued",
    });
  } else {
    // Underpaid: mark order as payment_failed, restore stock
    await supabase
      .from("orders")
      .update({ status: "payment_failed" })
      .eq("id", pending.order_id);

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("sku_id, quantity")
      .eq("order_id", pending.order_id);

    const { data: orderData } = await supabase
      .from("orders")
      .select("location_id")
      .eq("id", pending.order_id)
      .single();

    if (orderItems && orderData?.location_id) {
      for (const item of orderItems) {
        await supabase.rpc("increment_location_stock", {
          p_sku_id:      item.sku_id,
          p_location_id: orderData.location_id,
          p_delta:       item.quantity,
        });
        await supabase.from("inventory_log").insert({
          sku_id:    item.sku_id,
          delta:     item.quantity,
          reason:    "payment_failed",
          reference: pending.order_id,
        });
      }
    }
  }

  return NextResponse.json(ACCEPTED);
}
