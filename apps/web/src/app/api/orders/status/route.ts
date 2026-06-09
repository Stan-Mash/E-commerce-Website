import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Public order-status lookup (by order_ref) so checkout can confirm the M-Pesa
// callback marked the order paid. Returns only status + total, no PII.
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
