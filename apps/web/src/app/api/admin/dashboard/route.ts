import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function checkAuth(request: NextRequest): boolean {
  const session = request.cookies.get("admin_session");
  return session?.value === "elite-admin-2024";
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({
      total_revenue: 0,
      order_count: 0,
      product_count: 0,
      low_stock_count: 0,
      recent_orders: [],
      revenue_last_7_days: [],
    });
  }

  const supabase = getAdminClient();

  // Fetch in parallel
  const [ordersResult, productsResult, skusResult, recentOrdersResult] = await Promise.all([
    supabase
      .from("orders")
      .select("total, status, created_at")
      .in("status", ["paid", "processing", "ready_for_pickup", "shipped", "delivered"]),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("skus").select("stock_quantity").lt("stock_quantity", 5),
    supabase
      .from("orders")
      .select(`
        id,
        order_ref,
        status,
        total,
        phone,
        created_at,
        order_items(id)
      `)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const orders = ordersResult.data ?? [];
  const total_revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const order_count = orders.length;
  const product_count = productsResult.count ?? 0;
  const low_stock_count = (skusResult.data ?? []).length;

  // Revenue last 7 days
  const now = new Date();
  const revenue_last_7_days: { date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayRevenue = orders
      .filter((o) => o.created_at.slice(0, 10) === dateStr)
      .reduce((sum, o) => sum + Number(o.total), 0);
    revenue_last_7_days.push({ date: dateStr, revenue: dayRevenue });
  }

  return NextResponse.json({
    total_revenue,
    order_count,
    product_count,
    low_stock_count,
    recent_orders: recentOrdersResult.data ?? [],
    revenue_last_7_days,
  });
}
