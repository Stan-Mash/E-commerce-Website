import { NextRequest, NextResponse } from "next/server";
import { parseSTKCallback, type STKCallbackBody } from "@/lib/mpesa/daraja";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

// Safaricom Daraja callback IP ranges (sandbox + production)
const ALLOWED_IPS = new Set([
  "196.201.214.200",
  "196.201.214.206",
  "196.201.213.114",
  "196.201.214.207",
  "196.201.214.208",
  "196.201.213.44",
  "196.201.212.127",
  "196.201.212.128",
  "196.201.212.129",
  "196.201.212.132",
  "196.201.212.136",
  "196.201.212.138",
  // Sandbox
  "196.201.214.200",
]);

export async function POST(req: NextRequest) {
  // IP allowlist check
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "";

  if (process.env.MPESA_ENVIRONMENT === "production" && !ALLOWED_IPS.has(ip)) {
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
