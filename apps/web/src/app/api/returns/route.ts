import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// POST /api/returns — a customer requests a return/exchange for a paid order.
const Schema = z.object({
  orderRef: z.string().min(3).max(40),
  reason: z.string().min(5).max(500),
  notes: z.string().max(500).optional(),
});

const INELIGIBLE = new Set(["pending_payment", "payment_failed", "cancelled"]);

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Returns are not available yet." }, { status: 503 });
  }
  if (!(await rateLimit(`returns:${clientIp(req)}`, 10))) {
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
    return NextResponse.json({ error: "Please provide a valid order reference and reason." }, { status: 422 });
  }

  const { orderRef, reason, notes } = parsed.data;
  const supabase = createAdminSupabaseClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("order_ref", orderRef.trim().toUpperCase())
    .single();

  if (!order) {
    return NextResponse.json({ error: "We couldn't find an order with that reference." }, { status: 404 });
  }
  if (INELIGIBLE.has(order.status)) {
    return NextResponse.json({ error: "This order isn't eligible for a return." }, { status: 409 });
  }

  // Block a second open request for the same order.
  const { data: existing } = await supabase
    .from("returns")
    .select("id, status")
    .eq("order_id", order.id)
    .in("status", ["requested", "approved"]);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "A return is already in progress for this order." }, { status: 409 });
  }

  const { error } = await supabase.from("returns").insert({
    order_id: order.id,
    reason,
    notes: notes ?? null,
    status: "requested",
  });
  if (error) {
    console.error("[returns] insert error:", error.message);
    return NextResponse.json({ error: "Could not submit your return. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Return request received. We'll be in touch shortly." }, { status: 201 });
}
