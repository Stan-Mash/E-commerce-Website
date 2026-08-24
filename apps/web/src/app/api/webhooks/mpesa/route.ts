import { NextRequest, NextResponse } from "next/server";
import { parseSTKCallback, type STKCallbackBody } from "@/lib/mpesa/daraja";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isAlreadyProcessed, isAmountMismatch } from "@/lib/mpesa/stkDecision";

// Constant-time string comparison to avoid a timing side-channel on the secret.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function POST(req: NextRequest) {
  // Verify the ?secret= query param registered on the Daraja CallbackURL.
  // Daraja can't send custom headers, so the secret is the only auth gate.
  // Never log `secret`.
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.MPESA_WEBHOOK_SECRET ?? "";
  if (!secret || !expected || !timingSafeEqual(secret, expected)) {
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
    .select("id, status, amount")
    .eq("checkout_request_id", parsed.checkoutRequestId)
    .single();

  if (isAlreadyProcessed(existing)) {
    // Already processed; return 200 so Safaricom stops retrying.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // Defence in depth: the callback's amount must cover what the STK push
  // requested. The amount is server-set so a mismatch should never happen —
  // if it does, don't mark the order paid; leave it pending for manual review.
  if (isAmountMismatch(parsed, existing)) {
    console.error(
      `[mpesa-webhook] Amount mismatch on ${parsed.checkoutRequestId}: callback ${parsed.amount}, expected ${existing?.amount}`
    );
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  if (parsed.success && parsed.mpesaReceiptNumber) {
    // Mark the transaction paid. onConflict on checkout_request_id makes
    // Safaricom retries idempotent (update instead of duplicate-key error).
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

    // Update order status
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

      // Enqueue notification job; Vercel Cron picks it up within a minute.
      await supabase.from("notification_jobs").insert({
        order_id: txn.order_id,
        job_type: "order_confirmation",
        status: "queued",
      });
    }
  } else {
    // Payment failed or cancelled: restore the stock the checkout RPC reserved
    // and log it so the units aren't lost.
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
