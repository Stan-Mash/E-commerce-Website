import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function checkAuth(request: NextRequest): boolean {
  return isAuthenticatedAdminRequest(request);
}

const PAID_STATUSES = ["paid", "processing", "ready_for_pickup", "shipped", "delivered"];

// Category keywords for simple category detection from product names
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Women:       ["women", "woman", "ladies", "lady", "dress", "skirt", "blouse", "hijab", "abaya", "kaftan"],
  Men:         ["men", "man", "shirt", "trouser", "suit", "jacket", "tie", "polo"],
  Children:    ["children", "child", "kids", "kid", "baby", "girl", "boy", "toddler"],
  Accessories: ["accessories", "accessory", "bag", "handbag", "purse", "belt", "scarf", "shoe", "shoes", "sandal", "heel", "necklace", "bracelet", "earring", "ring", "jewel", "watch"],
};

function detectCategory(productName: string): string {
  const lower = productName.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "Other";
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({
      revenue_period: 0,
      revenue_today: 0,
      revenue_week: 0,
      revenue_month: 0,
      revenue_all_time: 0,
      orders_by_status: {},
      top_products: [],
      low_stock: [],
      category_breakdown: [],
      daily_revenue: [],
    });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam   = searchParams.get("to");

  const supabase = getAdminClient();

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  // Fetch all orders (for all-time stats) plus filtered orders for the date range
  let ordersQuery = supabase.from("orders").select("id, total, status, created_at");
  if (fromParam) ordersQuery = ordersQuery.gte("created_at", `${fromParam}T00:00:00.000Z`);
  if (toParam)   ordersQuery = ordersQuery.lte("created_at", `${toParam}T23:59:59.999Z`);

  // Fetch order items joined with product category data
  let itemsQuery = supabase.from("order_items").select(`
    quantity,
    subtotal,
    orders!inner(created_at, status),
    skus(
      id,
      products(id, name, category_id, categories(name))
    )
  `);
  if (fromParam) itemsQuery = itemsQuery.gte("orders.created_at", `${fromParam}T00:00:00.000Z`);
  if (toParam)   itemsQuery = itemsQuery.lte("orders.created_at", `${toParam}T23:59:59.999Z`);

  const [ordersResult, orderItemsResult, lowStockResult, allOrdersResult] = await Promise.all([
    ordersQuery,
    itemsQuery,
    supabase
      .from("skus")
      .select(`id, sku_code, size, stock_quantity, products(name)`)
      .lt("stock_quantity", 5),
    // All-time orders for all-time revenue (unfiltered)
    supabase.from("orders").select("id, total, status, created_at"),
  ]);

  const filteredOrders = ordersResult.data ?? [];
  const allOrders      = allOrdersResult.data ?? [];

  const paidFiltered = filteredOrders.filter((o) => PAID_STATUSES.includes(o.status));
  const paidAll      = allOrders.filter((o) => PAID_STATUSES.includes(o.status));

  // Period revenue (filtered range)
  const revenue_period = paidFiltered.reduce((sum, o) => sum + Number(o.total), 0);

  // Fixed-window revenues (always from all orders)
  const revenue_today = paidAll
    .filter((o) => o.created_at.slice(0, 10) === todayStr)
    .reduce((sum, o) => sum + Number(o.total), 0);

  const revenue_week = paidAll
    .filter((o) => new Date(o.created_at) >= weekAgo)
    .reduce((sum, o) => sum + Number(o.total), 0);

  const revenue_month = paidAll
    .filter((o) => new Date(o.created_at) >= monthAgo)
    .reduce((sum, o) => sum + Number(o.total), 0);

  const revenue_all_time = paidAll.reduce((sum, o) => sum + Number(o.total), 0);

  // Orders by status (filtered range)
  const orders_by_status: Record<string, number> = {};
  for (const order of filteredOrders) {
    orders_by_status[order.status] = (orders_by_status[order.status] ?? 0) + 1;
  }

  // Top products by revenue (filtered range)
  const productRevMap: Record<string, { name: string; units_sold: number; revenue: number }> = {};
  const categoryMap: Record<string, { revenue: number; orders: number }> = {};

  for (const item of orderItemsResult.data ?? []) {
    const orderData = item.orders as unknown as { created_at: string; status: string } | null;
    if (!orderData || !PAID_STATUSES.includes(orderData.status)) continue;

    const skuData = item.skus as unknown as {
      id: string;
      products: {
        id: string;
        name: string;
        category_id: string | null;
        categories: { name: string } | null;
      } | null;
    } | null;

    const product = skuData?.products;
    if (!product) continue;

    const pid = product.id;
    if (!productRevMap[pid]) {
      productRevMap[pid] = { name: product.name, units_sold: 0, revenue: 0 };
    }
    productRevMap[pid]!.units_sold += item.quantity;
    productRevMap[pid]!.revenue += Number(item.subtotal);

    // Category breakdown — prefer DB category name, fall back to keyword detection
    const catName = product.categories?.name ?? detectCategory(product.name);
    if (!categoryMap[catName]) categoryMap[catName] = { revenue: 0, orders: 0 };
    categoryMap[catName]!.revenue += Number(item.subtotal);
    categoryMap[catName]!.orders  += item.quantity;
  }

  const top_products = Object.values(productRevMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const category_breakdown = Object.entries(categoryMap)
    .map(([name, stats]) => ({ name, revenue: stats.revenue, order_count: stats.orders }))
    .sort((a, b) => b.revenue - a.revenue);

  // Daily revenue for the filtered range
  // Determine if we bucket by day or week
  const fromDate = fromParam ? new Date(`${fromParam}T00:00:00`) : new Date(monthAgo);
  const toDate   = toParam   ? new Date(`${toParam}T23:59:59`)   : new Date(now);
  const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  const useWeekly = diffDays > 30;

  // Build bucket map
  const bucketMap: Record<string, number> = {};

  for (const order of paidFiltered) {
    const d = new Date(order.created_at);
    let bucketKey: string;
    if (useWeekly) {
      // ISO week start (Monday)
      const day = d.getDay(); // 0=Sun
      const diff = (day === 0 ? -6 : 1 - day);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() + diff);
      bucketKey = weekStart.toISOString().slice(0, 10);
    } else {
      bucketKey = d.toISOString().slice(0, 10);
    }
    bucketMap[bucketKey] = (bucketMap[bucketKey] ?? 0) + Number(order.total);
  }

  // Generate all buckets in range so we have zeroes for empty days/weeks
  const daily_revenue: Array<{ date: string; revenue: number }> = [];
  if (useWeekly) {
    const cursor = new Date(fromDate);
    // align to Monday
    const startDay = cursor.getDay();
    cursor.setDate(cursor.getDate() + (startDay === 0 ? -6 : 1 - startDay));
    while (cursor <= toDate) {
      const key = cursor.toISOString().slice(0, 10);
      daily_revenue.push({ date: key, revenue: bucketMap[key] ?? 0 });
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    const cursor = new Date(fromDate);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= toDate) {
      const key = cursor.toISOString().slice(0, 10);
      daily_revenue.push({ date: key, revenue: bucketMap[key] ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

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
    revenue_period,
    revenue_today,
    revenue_week,
    revenue_month,
    revenue_all_time,
    orders_by_status,
    top_products,
    low_stock,
    category_breakdown,
    daily_revenue,
    is_weekly_buckets: useWeekly,
  });
}
