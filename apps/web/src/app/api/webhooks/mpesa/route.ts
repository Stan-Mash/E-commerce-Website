import { NextRequest, NextResponse } from "next/server";
import { parseSTKCallback, type STKCallbackBody } from "@/lib/mpesa/daraja";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // ── Secret token verification ────────────────────────────────────────
  // The CallbackURL registered with Safaricom includes a secret query param:
  //   https://yourdomain.com/api/webhooks/mpesa?secret=MPESA_WEBHOOK_SECRET
  // IP headers (x-forwarded-for) are trivially spoofable and NOT used here.
  // This secret is the only gate — any request missing it is rejected.
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: STKCallbackBody;
  try {
    body = (await req.json()) as STKCallbackBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseSTKCallback(body);
  const supabase = createAdminSupabaseClient();

  // Idempotency: look up by checkout_request_id
  const { data: existing } = await supabase
    .from("mpesa_transactions")
    .select("id, status")
    .eq("checkout_request_id", parsed.checkoutRequestId)
    .single();

  if (existing && existing.status !== "pending") {
    // Already processed — return 200 so Safaricom stops retrying
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  if (parsed.success && parsed.mpesaReceiptNumber) {
    // 1. Mark mpesa_transaction as paid.
    // onConflict targets the unique index on checkout_request_id so Safaricom
    // retries are safe — they update the row instead of crashing with a
    // duplicate-key violation.
    await supabase
      .from("mpesa_transactions")
      .upsert(
        {
          checkout_request_id: parsed.checkoutRequestId,
          merchant_request_id: parsed.merchantRequestId,
          status: "completed",
          mpesa_receipt_number: parsed.mpesaReceiptNumber,
          amount_paid: parsed.amount,
          phone_number: parsed.phoneNumber,
          transaction_date: parsed.transactionDate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "checkout_request_id" }
      );

    // 2. Update order status
    const { data: txn } = await supabase
      .from("mpesa_transactions")
      .select("order_id")
      .eq("checkout_request_id", parsed.checkoutRequestId)
      .single();

    if (txn?.order_id) {
      await supabase
        .from("orders")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", txn.order_id);

      // 3. Enqueue notification job — Vercel Cron picks it up within a minute
      await supabase.from("notification_jobs").insert({
        order_id: txn.order_id,
        job_type: "order_confirmation",
        status: "queued",
      });
    }
  } else {
    // Payment failed or cancelled.
    // FIX — inventory black hole: restore reserved stock and log to inventory_log
    // so the units aren't silently lost. This mirrors what the checkout RPC
    // deducted when the order was first created.
    await supabase
      .from("mpesa_transactions")
      .upsert(
        {
          checkout_request_id: parsed.checkoutRequestId,
          merchant_request_id: parsed.merchantRequestId,
          status: "failed",
          result_desc: parsed.resultDesc,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "checkout_request_id" }
      );

    const { data: txn } = await supabase
      .from("mpesa_transactions")
      .select("order_id")
      .eq("checkout_request_id", parsed.checkoutRequestId)
      .single();

    if (txn?.order_id) {
      await supabase
        .from("orders")
        .update({ status: "payment_failed" })
        .eq("id", txn.order_id);

      // Restore stock for every line item on this order
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("sku_id, quantity")
        .eq("order_id", txn.order_id);

      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          // Increment stock_quantity back
          await supabase.rpc("increment_sku_stock", {
            p_sku_id: item.sku_id,
            p_delta: item.quantity,
          });

          // Audit trail
          await supabase.from("inventory_log").insert({
            sku_id: item.sku_id,
            delta: item.quantity,          // positive = stock returned
            reason: "payment_failed",
            reference: txn.order_id,
          });
        }

        // Enqueue payment-failed notification so the customer knows to retry
        await supabase.from("notification_jobs").insert({
          order_id: txn.order_id,
          job_type: "payment_failed",
          status: "queued",
        });
      }
    }
  }

  // Safaricom expects this exact response shape
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
