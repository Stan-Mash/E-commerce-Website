import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { normaliseKenyanPhone } from "@/lib/utils";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// GET /api/account/orders?phone=...&ref=...
// Lightweight order history. Ownership is proven by supplying any one valid
// order reference for the phone (same trust model as Track Order) — no full
// auth system, but a stranger can't list a phone's orders without a real ref.
export async function GET(req: NextRequest) {
  const phoneRaw = req.nextUrl.searchParams.get("phone")?.trim();
  const ref = req.nextUrl.searchParams.get("ref")?.trim().toUpperCase();

  if (!phoneRaw || !ref) {
    return NextResponse.json({ error: "Enter your phone number and one order reference." }, { status: 400 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Accounts are not available yet." }, { status: 503 });
  }
  if (!(await rateLimit(`account:${clientIp(req)}`, 15))) {
    return NextResponse.json({ error: "Too many lookups. Please wait a moment." }, { status: 429 });
  }

  let phone: string;
  try {
    phone = normaliseKenyanPhone(phoneRaw);
  } catch {
    return NextResponse.json({ error: "Enter a valid Kenyan phone number." }, { status: 422 });
  }

  const supabase = createAdminSupabaseClient();

  // Proof of ownership: the ref must belong to this phone.
  const { data: proof } = await supabase
    .from("orders")
    .select("id")
    .eq("order_ref", ref)
    .eq("phone", phone)
    .maybeSingle();

  if (!proof) {
    return NextResponse.json({ error: "That phone number and order reference don't match." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("order_ref, status, total, delivery_type, created_at, tracking_number, courier, tracking_url")
    .eq("phone", phone)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Could not load your orders." }, { status: 500 });
  }

  return NextResponse.json({ phone: `${phoneRaw.slice(0, 6)}****`, orders: data ?? [] });
}
