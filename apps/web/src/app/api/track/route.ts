import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normaliseKenyanPhone } from "@/lib/utils";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const phoneRaw = searchParams.get("phone")?.trim();
  const ref = searchParams.get("ref")?.trim().toUpperCase();

  if (!phoneRaw || !ref) {
    return NextResponse.json({ error: "Missing required query params: phone and ref" }, { status: 400 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let phone: string;
  try {
    phone = normaliseKenyanPhone(phoneRaw);
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      order_ref, status, created_at, phone, tracking_number, courier, tracking_url,
      order_items(quantity, unit_price, sku:skus(product:products(name)))
    `)
    .eq("order_ref", ref)
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.error("[track] Supabase error:", error.message);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  type Row = {
    order_ref: string;
    status: string;
    created_at: string;
    tracking_number: string | null;
    courier: string | null;
    tracking_url: string | null;
    order_items: Array<{ quantity: number; unit_price: number; sku: { product: { name: string } | null } | null }> | null;
  };
  const order = data as unknown as Row;

  const items = (order.order_items ?? []).map((oi) => ({
    name: oi.sku?.product?.name ?? "Item",
    quantity: oi.quantity,
    price: oi.unit_price,
  }));

  return NextResponse.json({
    ref: order.order_ref,
    status: order.status,
    created_at: order.created_at,
    estimated_delivery: null,
    items,
    trackingNumber: order.tracking_number ?? null,
    courier: order.courier ?? null,
    trackingUrl: order.tracking_url ?? null,
    phone: `${phoneRaw.slice(0, 6)}****`,
  });
}
