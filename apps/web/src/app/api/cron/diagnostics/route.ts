import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

// Temporary, read-only diagnostic endpoint for investigating the "almost
// everything shows sold out" report. Gated by the same CRON_SECRET as
// /api/cron/notifications (no separate credential needed). Delete this file
// once the investigation is done — it is not meant to be a permanent route.

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

  const { data: products } = await supabase
    .from("products")
    .select("id, status");
  const productStatusCounts: Record<string, number> = {};
  for (const p of products ?? []) {
    productStatusCounts[p.status] = (productStatusCounts[p.status] ?? 0) + 1;
  }

  const { data: skus } = await supabase
    .from("skus")
    .select("id, stock_quantity, product_id");
  const zeroStockSkus = (skus ?? []).filter((s) => s.stock_quantity === 0).length;
  const nonZeroStockSkus = (skus ?? []).filter((s) => s.stock_quantity > 0).length;
  const negativeStockSkus = (skus ?? []).filter((s) => s.stock_quantity < 0).length;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, created_at");
  const orderStatusCounts: Record<string, number> = {};
  for (const o of orders ?? []) {
    orderStatusCounts[o.status] = (orderStatusCounts[o.status] ?? 0) + 1;
  }

  const now = Date.now();
  const pending = (orders ?? []).filter((o) => o.status === "pending_payment");
  const pendingAgeBuckets = {
    under1h: pending.filter((o) => now - new Date(o.created_at).getTime() < 1 * 3600_000).length,
    "1to2h": pending.filter((o) => {
      const age = now - new Date(o.created_at).getTime();
      return age >= 1 * 3600_000 && age < 2 * 3600_000;
    }).length,
    over2h: pending.filter((o) => now - new Date(o.created_at).getTime() >= 2 * 3600_000).length,
  };

  const oldestPending = pending
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5)
    .map((o) => ({ id: o.id, created_at: o.created_at }));

  // Sample of active products with all-zero stock, joined to a readable name.
  const { data: sampleZero } = await supabase
    .from("products")
    .select("id, name, status, skus(size, color, stock_quantity)")
    .eq("status", "active")
    .limit(8);
  const sample = (sampleZero ?? []).map((p) => ({
    name: p.name,
    skus: (p.skus as Array<{ size: string; color: string | null; stock_quantity: number }>).map(
      (s) => ({ size: s.size, color: s.color, stock_quantity: s.stock_quantity })
    ),
  }));

  return NextResponse.json({
    productStatusCounts,
    skuCounts: { zeroStockSkus, nonZeroStockSkus, negativeStockSkus, total: (skus ?? []).length },
    orderStatusCounts,
    pendingAgeBuckets,
    oldestPending,
    sampleActiveProducts: sample,
  });
}
