import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Public order-status lookup (by order_ref) so checkout can confirm the M-Pesa
// callback marked the order paid. Returns only status + total, no PII.
export async function GET(req: NextRequest) {
  const ref = (req.nextUrl.searchParams.get("ref") ?? "").trim();
  if (!ref) {
    return NextResponse.json({ error: "Missing order ref" }, { status: 400 });
  }

  // Checkout polls this every few seconds while waiting for the STK callback,
  // so the window is generous — it only needs to stop bulk ref enumeration.
  if (!(await rateLimit(`order-status:${clientIp(req)}`, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    // tracking_* come from migration 014; select * so older DBs still resolve.
    const { data, error } = await supabase
      .from("orders")
      .select("*")
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
      trackingNumber: data.tracking_number ?? null,
      courier: data.courier ?? null,
      trackingUrl: data.tracking_url ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
