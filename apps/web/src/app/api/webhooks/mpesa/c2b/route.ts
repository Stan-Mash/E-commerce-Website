// Safaricom Daraja C2B webhook handler.
// Register in the Daraja portal (Apps -> C2B -> Register URLs):
//   Validation:   .../api/webhooks/mpesa/c2b?secret=MPESA_WEBHOOK_SECRET&type=validation
//   Confirmation: .../api/webhooks/mpesa/c2b?secret=MPESA_WEBHOOK_SECRET&type=confirmation
// Validation accepts all; confirmation matches BillRefNumber to c2b_payments,
// marks the order paid, and notifies the POS via Supabase Realtime.

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { safeEqual } from "@/lib/adminAuth";

const ACCEPTED  = { ResultCode: 0, ResultDesc: "Accepted" };
const REJECTED  = { ResultCode: 1, ResultDesc: "Rejected" };

function isAuthorised(req: NextRequest): boolean {
  const secret = req.nextUrl.searchParams.get("secret");
  return !!secret && safeEqual(secret, process.env.MPESA_WEBHOOK_SECRET ?? "");
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
    BillRefNumber,   // Paybill: the account ref the customer typed.
                      // Buy Goods/Till: NOT the order_ref — the customer's
                      // phone can't type a reference there at all, so
                      // Safaricom fills this with the paying phone number
                      // instead. Confirmed via Daraja integration docs.
    TransAmount,     // "8500.00"
    MSISDN,         // customer phone
    TransID,        // Safaricom receipt number
  } = body;

  const supabase = createAdminSupabaseClient();

  let pending: { id: string; order_id: string; expected_amount: number; status: string } | null = null;

  if (BillRefNumber) {
    const { data } = await supabase
      .from("c2b_payments")
      .select("id, order_id, expected_amount, status")
      .eq("order_ref", BillRefNumber)
      .maybeSingle();
    pending = data;
  }

  // Fall back to phone + amount matching — the only real signal a Buy Goods
  // confirmation carries. Restrict candidates to ones this payment could
  // actually satisfy (expected_amount <= what was paid) and take the oldest,
  // so an unrelated smaller pending order from the same phone doesn't win
  // over the one the customer actually meant to pay. Ambiguous when a phone
  // has multiple eligible pending orders — logged below so it's visible,
  // not silently guessed away.
  if (!pending) {
    const normalisedMsisdn = (MSISDN ?? "").replace(/\D/g, "");
    const paidAmount = parseFloat(TransAmount ?? "0");

    if (normalisedMsisdn && paidAmount > 0) {
      const { data: candidates } = await supabase
        .from("c2b_payments")
        .select("id, order_id, order_ref, expected_amount, status, created_at")
        .eq("phone", normalisedMsisdn)
        .eq("status", "pending")
        .lte("expected_amount", paidAmount)
        .order("created_at", { ascending: true })
        .limit(2);

      const match = candidates?.[0];
      if (match) {
        pending = match;
        console.log(
          `[c2b webhook] phone-fallback match: phone=${normalisedMsisdn} amount=${paidAmount} ` +
          `-> order_ref=${match.order_ref}` +
          (candidates && candidates.length > 1 ? ` (ambiguous: ${candidates.length} eligible pending orders for this phone)` : "")
        );
      }
    }
  }

  if (!pending || pending.status !== "pending") {
    // Unknown reference/phone or already processed - accept silently
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
    // Mark order paid - Supabase Realtime broadcasts this change to the POS page
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

    if (orderItems) {
      for (const item of orderItems) {
        // POS orders restore to their location; web orders (no location_id)
        // restore via the default-warehouse RPC so the stock isn't lost.
        if (orderData?.location_id) {
          await supabase.rpc("increment_location_stock", {
            p_sku_id:      item.sku_id,
            p_location_id: orderData.location_id,
            p_delta:       item.quantity,
          });
        } else {
          await supabase.rpc("increment_sku_stock", {
            p_sku_id: item.sku_id,
            p_delta:  item.quantity,
          });
        }
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
