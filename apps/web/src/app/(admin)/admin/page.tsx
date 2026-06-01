import type { Metadata } from "next";
import Link from "next/link";
import DashboardChart from "./DashboardChart";
import AnimatedCounter from "./AnimatedCounter";

export const metadata: Metadata = { title: "Dashboard" };

interface DashboardData {
  total_revenue: number;
  order_count: number;
  product_count: number;
  low_stock_count: number;
  recent_orders: Array<{
    id: string;
    order_ref: string;
    status: string;
    total: number;
    phone: string;
    created_at: string;
    order_items: Array<{ id: string }>;
  }>;
  revenue_last_7_days: Array<{ date: string; revenue: number }>;
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_BADGE: Record<string, { background: string; color: string }> = {
  pending_payment: { background: "#fff8e1", color: "#f57f17" },
  paid: { background: "#e8f5e9", color: "#2e7d32" },
  payment_failed: { background: "#fde8e8", color: "#c0392b" },
  processing: { background: "#e3f2fd", color: "#1565c0" },
  ready_for_pickup: { background: "#e8f5e9", color: "#2e7d32" },
  shipped: { background: "#e8f5e9", color: "#2e7d32" },
  delivered: { background: "#e8f5e9", color: "#2e7d32" },
  cancelled: { background: "#fde8e8", color: "#c0392b" },
  refunded: { background: "#fafafa", color: "#757575" },
};

async function getDashboardData(): Promise<DashboardData> {
  const empty: DashboardData = {
    total_revenue: 0,
    order_count: 0,
    product_count: 0,
    low_stock_count: 0,
    recent_orders: [],
    revenue_last_7_days: [],
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const PAID_STATUSES = ["paid", "processing", "ready_for_pickup", "shipped", "delivered"];

    const [ordersResult, productsResult, skusResult, recentOrdersResult] = await Promise.all([
      supabase
        .from("orders")
        .select("total, status, created_at")
        .in("status", PAID_STATUSES),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("skus").select("stock_quantity").lt("stock_quantity", 5),
      supabase
        .from("orders")
        .select("id, order_ref, status, total, phone, created_at, order_items(id)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const orders = ordersResult.data ?? [];
    const total_revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const order_count = orders.length;
    const product_count = productsResult.count ?? 0;
    const low_stock_count = (skusResult.data ?? []).length;

    const now = new Date();
    const revenue_last_7_days: Array<{ date: string; revenue: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayRevenue = orders
        .filter((o) => o.created_at.slice(0, 10) === dateStr)
        .reduce((sum, o) => sum + Number(o.total), 0);
      revenue_last_7_days.push({ date: dateStr, revenue: dayRevenue });
    }

    return {
      total_revenue,
      order_count,
      product_count,
      low_stock_count,
      recent_orders: (recentOrdersResult.data ?? []) as DashboardData["recent_orders"],
      revenue_last_7_days,
    };
  } catch {
    return empty;
  }
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const maxRevenue = Math.max(...data.revenue_last_7_days.map((d) => d.revenue), 0);

  const lastUpdated = new Date().toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const STATS: Array<{
    label: string;
    value: number;
    prefix?: string;
    accent: string;
    isLowStock?: boolean;
  }> = [
    {
      label: "Total Revenue",
      value: data.total_revenue,
      prefix: "Ksh",
      accent: "var(--es-gold)",
    },
    {
      label: "Total Orders",
      value: data.order_count,
      accent: "var(--es-plum)",
    },
    {
      label: "Products",
      value: data.product_count,
      accent: "var(--es-plum)",
    },
    {
      label: "Low Stock SKUs",
      value: data.low_stock_count,
      accent: data.low_stock_count > 0 ? "#c0392b" : "#2e7d32",
      isLowStock: true,
    },
  ];

  return (
    <div>
      {/* Page heading */}
      <div style={{ marginBottom: 40 }}>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 11,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--es-gold)",
            marginBottom: 8,
          }}
        >
          Overview
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: 36,
              fontWeight: 400,
              color: "var(--es-ink)",
              margin: 0,
            }}
          >
            Dashboard
          </h1>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              color: "var(--es-mute)",
              margin: 0,
              letterSpacing: "0.05em",
            }}
          >
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 24,
          marginBottom: 48,
        }}
      >
        {STATS.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--es-white)",
              padding: "32px 28px 28px",
              borderTop: `3px solid ${stat.accent}`,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-bodoni)",
                fontSize: 34,
                fontWeight: 400,
                color: stat.accent,
                margin: "0 0 10px",
                lineHeight: 1,
              }}
            >
              <AnimatedCounter
                value={stat.value}
                prefix={stat.prefix}
                duration={1200}
              />
            </p>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "var(--es-mute)",
                margin: 0,
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 16, marginBottom: 48, flexWrap: "wrap" }}>
        <Link
          href="/admin/products/new"
          className="es-btn-plum"
          style={{ textDecoration: "none" }}
        >
          + Add Product
        </Link>
        <Link
          href="/admin/orders"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "10px 24px",
            background: "transparent",
            border: "1px solid var(--es-ink)",
            color: "var(--es-ink)",
            fontFamily: "var(--font-inter)",
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          View Orders
        </Link>
        <Link
          href="/admin/pos"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "10px 24px",
            background: "var(--es-gold)",
            border: "1px solid var(--es-gold)",
            color: "var(--es-ink)",
            fontFamily: "var(--font-inter)",
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            textDecoration: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Open POS
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* Revenue bar chart */}
        <div style={{ background: "var(--es-white)", padding: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "var(--es-mute)",
                margin: 0,
              }}
            >
              Revenue — Last 7 Days
            </p>
            {/* Date range note */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "var(--font-inter)",
                fontSize: 10,
                color: "var(--es-mute)",
                letterSpacing: "0.05em",
              }}
              title="Showing revenue from paid, processing, shipped, and delivered orders over the last 7 days"
            >
              {/* Info icon */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M8 7v5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="4.5" r="0.75" fill="currentColor" />
              </svg>
              Last 7 days
            </span>
          </div>

          <DashboardChart data={data.revenue_last_7_days} maxRevenue={maxRevenue} />
        </div>

        {/* Recent orders */}
        <div style={{ background: "var(--es-white)", padding: 32 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "var(--es-mute)",
                margin: 0,
              }}
            >
              Recent Orders
            </p>
            <Link
              href="/admin/orders"
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                color: "var(--es-plum)",
                textDecoration: "none",
                letterSpacing: "0.1em",
              }}
            >
              View all →
            </Link>
          </div>

          {data.recent_orders.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                color: "var(--es-mute)",
                textAlign: "center",
                padding: "24px 0",
              }}
            >
              No orders yet
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {data.recent_orders.map((order) => {
                const badge = STATUS_BADGE[order.status] ?? { background: "#fafafa", color: "#757575" };
                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 0",
                      borderBottom: "1px solid var(--es-bone)",
                      textDecoration: "none",
                      gap: 8,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: "var(--es-ink)",
                          margin: 0,
                          fontWeight: 600,
                        }}
                      >
                        {order.order_ref}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 11,
                          color: "var(--es-mute)",
                          margin: "2px 0 0",
                        }}
                      >
                        {order.phone} &middot;{" "}
                        {new Date(order.created_at).toLocaleDateString("en-KE")}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--es-ink)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatKES(Number(order.total))}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 10,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: 2,
                          whiteSpace: "nowrap",
                          background: badge.background,
                          color: badge.color,
                        }}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
