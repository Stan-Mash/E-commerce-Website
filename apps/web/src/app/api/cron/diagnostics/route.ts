import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

// Temporary, read-only diagnostic endpoint. Gated by CRON_SECRET. Delete once
// the investigation concludes — not meant to be a permanent route.

function isAuthorised(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: locations } = await supabase.from("locations").select("id, name, type, is_active");

  const { data: skus } = await supabase
    .from("skus")
    .select("id, sku_code, size, color, stock_quantity, product_id")
    .limit(10);

  const skuIds = (skus ?? []).map((s) => s.id);
  const { data: invLevels } = await supabase
    .from("inventory_levels")
    .select("sku_id, location_id, quantity")
    .in("sku_id", skuIds);

  const compare = (skus ?? []).map((s) => ({
    sku_code: s.sku_code,
    size: s.size,
    color: s.color,
    skus_stock_quantity: s.stock_quantity,
    inventory_levels: (invLevels ?? [])
      .filter((i) => i.sku_id === s.id)
      .map((i) => {
        const loc = (locations ?? []).find((l) => l.id === i.location_id);
        return { location: loc?.name ?? i.location_id, quantity: i.quantity };
      }),
  }));

  return NextResponse.json({ locations, sample: compare });
}

// One-time backfill: push skus.stock_quantity into inventory_levels for the
// store location, for every SKU. Repairs the historical damage from the
// "Main Warehouse" lookup bug (fixed in the same deploy as this call) —
// admin-entered stock was saved to skus.stock_quantity (what the storefront
// displays) but never synced to inventory_levels (what checkout actually
// reserves against), so affected items looked in stock but failed at
// checkout. Idempotent: safe to call more than once, always sets
// inventory_levels to match the current skus.stock_quantity value.
export async function POST(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: store } = await supabase
    .from("locations")
    .select("id, name")
    .eq("type", "store")
    .limit(1)
    .single();

  if (!store) {
    return NextResponse.json({ error: "No active store location found" }, { status: 500 });
  }

  const { data: allSkus, error: skusErr } = await supabase
    .from("skus")
    .select("id, stock_quantity");

  if (skusErr || !allSkus) {
    return NextResponse.json({ error: skusErr?.message ?? "Failed to fetch skus" }, { status: 500 });
  }

  const { error: upsertErr } = await supabase.from("inventory_levels").upsert(
    allSkus.map((s) => ({ sku_id: s.id, location_id: store.id, quantity: s.stock_quantity })),
    { onConflict: "sku_id,location_id" }
  );

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  return NextResponse.json({ repaired: allSkus.length, location: store.name });
}
