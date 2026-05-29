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
  const session = request.cookies.get("admin_session")?.value === "elite-admin-2024";
  const token   = request.cookies.get("admin_token")?.value   === "elite-admin-2024";
  const header  = request.headers.get("x-admin-token")        === "elite-admin-2024";
  return session || token || header;
}

const PAID_STATUSES = ["paid", "processing", "ready_for_pickup", "shipped", "delivered"];

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({
      revenue_today: 0,
      revenue_week: 0,
      revenue_month: 0,
      revenue_all_time: 0,
      orders_by_status: {},
      top_products: [],
      low_stock: [],
    });
  }

  const supabase = getAdminClient();

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const [ordersResult, orderItemsResult, lowStockResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total, status, created_at"),
    supabase
      .from("order_items")
      .select(`
        quantity,
        subtotal,
        skus(
          id,
          products(id, name)
        )
      `),
    supabase
      .from("skus")
      .select(`
        id,
        sku_code,
        size,
        stock_quantity,
        products(name)
      `)
      .lt("stock_quantity", 5),
  ]);

  const allOrders = ordersResult.data ?? [];
  const paidOrders = allOrders.filter((o) => PAID_STATUSES.includes(o.status));

  const revenue_today = paidOrders
    .filter((o) => o.created_at.slice(0, 10) === todayStr)
    .reduce((sum, o) => sum + Number(o.total), 0);

  const revenue_week = paidOrders
    .filter((o) => new Date(o.created_at) >= weekAgo)
    .reduce((sum, o) => sum + Number(o.total), 0);

  const revenue_month = paidOrders
    .filter((o) => new Date(o.created_at) >= monthAgo)
    .reduce((sum, o) => sum + Number(o.total), 0);

  const revenue_all_time = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);

  // Orders by status
  const orders_by_status: Record<string, number> = {};
  for (const order of allOrders) {
    orders_by_status[order.status] = (orders_by_status[order.status] ?? 0) + 1;
  }

  // Top products by revenue
  const productRevMap: Record<string, { name: string; units_sold: number; revenue: number }> = {};
  for (const item of orderItemsResult.data ?? []) {
    const skuData = item.skus as unknown as { id: string; products: { id: string; name: string } | null } | null;
    const product = skuData?.products;
    if (!product) continue;
    const pid = product.id;
    if (!productRevMap[pid]) {
      productRevMap[pid] = { name: product.name, units_sold: 0, revenue: 0 };
    }
    productRevMap[pid]!.units_sold += item.quantity;
    productRevMap[pid]!.revenue += Number(item.subtotal);
  }
  const top_products = Object.values(productRevMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Low stock
  const low_stock = (lowStockResult.data ?? []).map((sku) => {
    const prod = sku.products as unknown as { name: string } | null;
    return {
      product_name: prod?.name ?? "Unknown",
      sku_code: sku.sku_code,
      size: sku.size,
      stock_quantity: sku.stock_quantity,
    };
  });

  return NextResponse.json({
    revenue_today,
    revenue_week,
    revenue_month,
    revenue_all_time,
    orders_by_status,
    top_products,
    low_stock,
  });
}
