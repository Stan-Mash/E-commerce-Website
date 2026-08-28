import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { normaliseKenyanPhone } from "@/lib/utils";

// POST /api/orders/report-payment — a customer who paid via Buy Goods hands
// over their M-Pesa confirmation code, so admin staff have something to act
// on immediately instead of hunting through the orders list for a match.
// This is a safety net alongside the C2B webhook, not a replacement for it —
// reporting a code never changes order status on its own; a staff member
// still has to confirm it (see /admin/pending-payments).
const Schema = z.object({
  orderRef: z.string().min(3).max(40),
  phone: z.string().min(9).max(15),
  mpesaCode: z.string().trim().regex(/^[A-Za-z0-9]{8,12}$/, "Enter the M-Pesa code exactly as it appears in your message."),
});

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not available yet." }, { status: 503 });
  }
  if (!(await rateLimit(`report-payment:${clientIp(req)}`, 10))) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid order reference, phone, and M-Pesa code." }, { status: 422 });
  }

  const { orderRef, phone: phoneRaw, mpesaCode } = parsed.data;

  let phone: string;
  try {
    phone = normaliseKenyanPhone(phoneRaw);
  } catch {
    return NextResponse.json({ error: "We couldn't find an order with that reference and phone." }, { status: 404 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("order_ref", orderRef.trim().toUpperCase())
    .eq("phone", phone)
    .single();

  if (!order) {
    return NextResponse.json({ error: "We couldn't find an order with that reference and phone." }, { status: 404 });
  }
  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "This order is not awaiting payment." }, { status: 409 });
  }

  const { error } = await supabase
    .from("c2b_payments")
    .update({ customer_reported_code: mpesaCode.toUpperCase(), customer_reported_at: new Date().toISOString() })
    .eq("order_id", order.id);

  if (error) {
    console.error("[report-payment] update error:", error.message);
    return NextResponse.json({ error: "Could not submit your code. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Thanks — we'll confirm this shortly." }, { status: 200 });
}
