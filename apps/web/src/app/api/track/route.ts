import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const phone = searchParams.get("phone")?.trim();
  const ref = searchParams.get("ref")?.trim().toUpperCase();

  if (!phone || !ref) {
    return NextResponse.json(
      { error: "Missing required query params: phone and ref" },
      { status: 400 }
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Supabase not configured — return a mock for local dev
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, ref, status, phone, created_at, estimated_delivery, items"
    )
    .eq("ref", ref)
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.error("[track] Supabase error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Normalise items — the orders table may store them as JSON or an array
  let items: { name: string; quantity: number; price: number }[] = [];
  if (Array.isArray(data.items)) {
    items = data.items;
  } else if (typeof data.items === "string") {
    try {
      items = JSON.parse(data.items);
    } catch {
      items = [];
    }
  }

  return NextResponse.json({
    ref: data.ref,
    status: data.status,
    created_at: data.created_at,
    estimated_delivery: data.estimated_delivery ?? null,
    items,
    // Do not expose the full phone number
    phone: `${String(phone).slice(0, 6)}****`,
  });
}
