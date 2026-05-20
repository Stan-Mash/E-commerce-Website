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
    // 1. Mark mpesa_transaction as paid
    await supabase
      .from("mpesa_transactions")
      .upsert({
        checkout_request_id: parsed.checkoutRequestId,
        merchant_request_id: parsed.merchantRequestId,
        status: "completed",
        mpesa_receipt_number: parsed.mpesaReceiptNumber,
        amount_paid: parsed.amount,
        phone_number: parsed.phoneNumber,
        transaction_date: parsed.transactionDate,
        updated_at: new Date().toISOString(),
      });

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

      // 3. Enqueue notification job (BullMQ worker picks it up)
      // Worker reads from the same Redis; we write a lightweight trigger record
      await supabase.from("notification_jobs").insert({
        order_id: txn.order_id,
        job_type: "order_confirmation",
        status: "queued",
      });
    }
  } else {
    // Payment failed or cancelled
    await supabase
      .from("mpesa_transactions")
      .upsert({
        checkout_request_id: parsed.checkoutRequestId,
        merchant_request_id: parsed.merchantRequestId,
        status: "failed",
        result_desc: parsed.resultDesc,
        updated_at: new Date().toISOString(),
      });

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
    }
  }

  // Safaricom expects this exact response shape
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
