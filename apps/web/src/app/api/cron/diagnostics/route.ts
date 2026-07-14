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
    .order("updated_at", { ascending: false })
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

  return NextResponse.json({ locations, mostRecentlyUpdatedSkus: compare });
}
