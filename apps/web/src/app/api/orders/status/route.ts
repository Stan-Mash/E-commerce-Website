import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Public order-status lookup used by the checkout page to confirm a payment
 * actually went through (M-Pesa callback marks the order 'paid') instead of
 * optimistically assuming success after a fixed delay.
 *
 * Looked up by order_ref, which the client already holds; no PII is returned
 * beyond the status and total the customer just attempted to pay.
 */
export async function GET(req: NextRequest) {
  const ref = (req.nextUrl.searchParams.get("ref") ?? "").trim();
  if (!ref) {
    return NextResponse.json({ error: "Missing order ref" }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select("order_ref, status, total")
      .eq("order_ref", ref)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const PAID = ["paid", "processing", "ready_for_pickup", "shipped", "delivered"];
    const FAILED = ["payment_failed", "cancelled"];

    const state = PAID.includes(data.status)
      ? "paid"
      : FAILED.includes(data.status)
        ? "failed"
        : "pending";

    return NextResponse.json({
      orderRef: data.order_ref,
      status: data.status,
      state,
      total: data.total,
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
