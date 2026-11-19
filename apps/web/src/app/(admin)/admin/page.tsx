"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp, AlertTriangle, Package,
  ShoppingBag, DollarSign, BarChart2, RefreshCw,
  ArrowRight, Zap, Clock
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportsData {
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  revenue_all_time: number;
  orders_by_status: Record<string, number>;
  top_products: Array<{ name: string; units_sold: number; revenue: number }>;
  low_stock: Array<{ product_name: string; sku_code: string; size: string; stock_quantity: number }>;
  category_breakdown: Array<{ name: string; revenue: number; order_count: number }>;
  daily_revenue: Array<{ date: string; revenue: number }>;
  is_weekly_buckets: boolean;
}

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function kes(n: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency", currency: "KES",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

const NEEDS_ATTENTION_STATUSES = ["pending_payment", "processing", "payment_failed"];
const PAID_STATUSES = ["paid", "ready_for_pickup", "shipped", "delivered"];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: "Pending Payment",  color: "#d97706", bg: "#fffbeb" },
  paid:            { label: "Paid",              color: "#16a34a", bg: "#f0fdf4" },
  payment_failed:  { label: "Payment Failed",    color: "#dc2626", bg: "#fef2f2" },
  processing:      { label: "Processing",        color: "#2563eb", bg: "#eff6ff" },
  ready_for_pickup:{ label: "Ready for Pickup",  color: "#7c3aed", bg: "#f5f3ff" },
  shipped:         { label: "Shipped",           color: "#0891b2", bg: "#ecfeff" },
  delivered:       { label: "Delivered",         color: "#16a34a", bg: "#f0fdf4" },
  cancelled:       { label: "Cancelled",         color: "#6b7280", bg: "#f9fafb" },
  refunded:        { label: "Refunded",          color: "#9333ea", bg: "#fdf4ff" },
};

// ---------------------------------------------------------------------------
// SVG 30-day revenue chart
// ---------------------------------------------------------------------------

function RevenueChart({ data }: { data: Array<{ date: string; revenue: number }> }) {
  const W = 660, H = 130, PL = 4, PR = 4, PT = 12, PB = 30;
  const cw = W - PL - PR;
  const ch = H - PT - PB;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const n = data.length;
  const gap = 2;
  const bw = Math.max(2, (cw - gap * (n - 1)) / n);
  const labelEvery = n <= 10 ? 1 : n <= 21 ? 3 : 5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={PL} x2={W - PR}
          y1={PT + ch * (1 - t)} y2={PT + ch * (1 - t)}
          stroke="var(--es-bone)" strokeWidth={1} />
      ))}
      {data.map((d, i) => {
        const bh = Math.max(2, (d.revenue / max) * ch);
        const x = PL + i * (bw + gap);
        const y = PT + ch - bh;
        const dt = new Date(d.date + "T00:00:00");
        const lbl = dt.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
        return (
          <g key={d.date}>
            <rect x={x} y={y} width={bw} height={bh}
              fill={d.revenue === 0 ? "var(--es-bone)" : "var(--es-plum)"} rx={1} />
            {i % labelEvery === 0 && (
              <text x={x + bw / 2} y={H - 6} textAnchor="middle"
                fontSize={8} fill="var(--es-mute)" fontFamily="var(--font-inter)">
                {lbl}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

function KpiCard({
  label, value, sub, accent, icon: Icon, to,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  to?: string;
}) {
  const inner = (
    <div style={{
      background: "var(--es-white)",
      padding: "24px 22px 20px",
      borderTop: `3px solid ${accent}`,
      height: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      cursor: to ? "pointer" : "default",
      transition: "box-shadow 0.15s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <Icon size={18} color={accent} />
      </div>
      <p style={{ fontFamily: "var(--font-bodoni)", fontSize: 28, fontWeight: 400, color: accent, margin: 0, lineHeight: 1.1 }}>
        {value}
      </p>
      <p style={{ fontFamily: "var(--font-inter)", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--es-mute)", margin: 0 }}>
        {label}
      </p>
      {sub && (
        <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "var(--es-mute)", margin: "4px 0 0" }}>
          {sub}
        </p>
      )}
    </div>
  );
  if (to) return <Link href={to} style={{ textDecoration: "none", display: "block" }}>{inner}</Link>;
  return inner;
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    const from30 = new Date(now);
    from30.setDate(from30.getDate() - 29);
    const from = from30.toISOString().slice(0, 10);

    const [rRes, dRes] = await Promise.all([
      fetch(`/api/admin/reports?from=${from}&to=${to}`, { credentials: "include" }),
      fetch("/api/admin/dashboard", { credentials: "include" }),
    ]);

    if (rRes.status === 401 || dRes.status === 401) {
      window.location.href = "/admin/login?error=session";
      return;
    }

    const [rJson, dJson] = await Promise.all([
      rRes.ok ? (rRes.json() as Promise<ReportsData>) : Promise.resolve(null),
      dRes.ok ? (dRes.json() as Promise<DashboardData>) : Promise.resolve(null),
    ]);

    setReports(rJson);
    setDash(dJson);
    setLastUpdated(new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Derived metrics
  const needsAttention = reports
    ? NEEDS_ATTENTION_STATUSES.reduce((s, st) => s + (reports.orders_by_status[st] ?? 0), 0)
    : 0;

  const fulfilledCount = reports
    ? PAID_STATUSES.reduce((s, st) => s + (reports.orders_by_status[st] ?? 0), 0)
    : 0;

  const totalOrders = reports
    ? Object.values(reports.orders_by_status).reduce((s, n) => s + n, 0)
    : 0;

  const avgOrderValue = totalOrders > 0 && reports
    ? reports.revenue_month / Math.max(1, PAID_STATUSES.reduce((s, st) => s + (reports.orders_by_status[st] ?? 0), 0))
    : 0;

  const maxCatRev = reports
    ? Math.max(...reports.category_breakdown.map(c => c.revenue), 1)
    : 1;

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 8 }}>
            Overview
          </p>
          <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 36, fontWeight: 400, color: "var(--es-ink)", margin: 0 }}>
            Dashboard
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {lastUpdated && (
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "var(--es-mute)" }}>
              Updated {lastUpdated}
            </span>
          )}
          <button
            onClick={() => void load()}
            disabled={loading}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px",
              border: "1px solid var(--es-bone)",
              background: "transparent",
              fontFamily: "var(--font-inter)", fontSize: 11,
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: loading ? "var(--es-mute)" : "var(--es-ink)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Needs Attention alert ───────────────────────────────────── */}
      {needsAttention > 0 && (
        <Link href="/admin/orders?status=pending_payment" style={{ textDecoration: "none" }}>
          <div style={{
            background: "#fffbeb", border: "1px solid #fbbf24",
            padding: "12px 20px", marginBottom: 28,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <AlertTriangle size={16} color="#d97706" />
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#92400e", margin: 0, flex: 1 }}>
              <strong>{needsAttention} order{needsAttention > 1 ? "s" : ""}</strong> need{needsAttention === 1 ? "s" : ""} your attention — pending payment or processing
            </p>
            <ArrowRight size={14} color="#d97706" />
          </div>
        </Link>
      )}

      {reports?.low_stock && reports.low_stock.length > 0 && (
        <Link href="/admin/stock" style={{ textDecoration: "none" }}>
          <div style={{
            background: "#fef2f2", border: "1px solid #fca5a5",
            padding: "12px 20px", marginBottom: 28,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <Package size={16} color="#dc2626" />
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#7f1d1d", margin: 0, flex: 1 }}>
              <strong>{reports.low_stock.length} SKU{reports.low_stock.length > 1 ? "s" : ""}</strong> running low on stock — restock needed
            </p>
            <ArrowRight size={14} color="#dc2626" />
          </div>
        </Link>
      )}

      {/* ── 4 KPI tiles ────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20, marginBottom: 36 }}>
        <KpiCard
          label="Today's Revenue"
          value={loading ? "—" : kes(reports?.revenue_today ?? 0)}
          accent="var(--es-gold)"
          icon={DollarSign}
          to="/admin/reports"
        />
        <KpiCard
          label="This Month"
          value={loading ? "—" : kes(reports?.revenue_month ?? 0)}
          sub={`avg ${loading ? "—" : kes(avgOrderValue)} / order`}
          accent="var(--es-plum)"
          icon={TrendingUp}
          to="/admin/reports"
        />
        <KpiCard
          label="All-Time Revenue"
          value={loading ? "—" : kes(reports?.revenue_all_time ?? 0)}
          sub={`${dash?.order_count ?? 0} paid orders total`}
          accent="#16a34a"
          icon={BarChart2}
          to="/admin/reports"
        />
        <KpiCard
          label="Needs Attention"
          value={loading ? "—" : String(needsAttention)}
          sub={`${fulfilledCount} fulfilled this period`}
          accent={needsAttention > 0 ? "#dc2626" : "#16a34a"}
          icon={needsAttention > 0 ? AlertTriangle : Zap}
          to="/admin/orders"
        />
      </div>

      {/* ── Quick actions ──────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap" }}>
        {[
          { href: "/admin/products/new",    label: "+ Add Product",   style: "plum" as const },
          { href: "/admin/orders",          label: "All Orders",      style: "outline" as const },
          { href: "/admin/pos",             label: "Open POS",        style: "gold" as const },
          { href: "/admin/reports",         label: "Reports",         style: "outline" as const },
          { href: "/admin/finance",         label: "Finance",         style: "outline" as const },
          { href: "/admin/stock",           label: "Inventory",       style: "outline" as const },
        ].map(btn => (
          <Link
            key={btn.href}
            href={btn.href}
            className={btn.style === "plum" ? "es-btn-plum" : undefined}
            style={{
              display: "inline-flex", alignItems: "center",
              padding: "9px 20px",
              fontFamily: "var(--font-inter)", fontSize: 11,
              letterSpacing: "0.2em", textTransform: "uppercase",
              textDecoration: "none", cursor: "pointer",
              ...(btn.style === "gold" ? {
                background: "var(--es-gold)", border: "1px solid var(--es-gold)",
                color: "var(--es-ink)", fontWeight: 600,
              } : btn.style === "outline" ? {
                background: "transparent", border: "1px solid var(--es-ink)",
                color: "var(--es-ink)",
              } : {}),
            }}
          >
            {btn.label}
          </Link>
        ))}
      </div>

      {/* ── Revenue chart + Orders by status ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 24, marginBottom: 24, alignItems: "start" }}>
        {/* 30-day chart */}
        <div style={{ background: "var(--es-white)", padding: "28px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--es-mute)", margin: 0 }}>
              Revenue: Last 30 Days
            </p>
            {reports && (
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "var(--es-plum)", fontWeight: 600 }}>
                {kes(reports.daily_revenue.reduce((s, d) => s + d.revenue, 0))}
              </span>
            )}
          </div>
          {loading ? (
            <div style={{ height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)" }}>Loading…</span>
            </div>
          ) : reports && reports.daily_revenue.length > 0 ? (
            <RevenueChart data={reports.daily_revenue} />
          ) : (
            <div style={{ height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)" }}>No revenue data</span>
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div style={{ background: "var(--es-white)", padding: "28px 24px" }}>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--es-mute)", margin: "0 0 20px" }}>
            Orders by Status
          </p>
          {loading ? (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)" }}>Loading…</p>
          ) : !reports || Object.keys(reports.orders_by_status).length === 0 ? (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)" }}>No orders yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(reports.orders_by_status)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => {
                  const meta = STATUS_META[status] ?? { label: status, color: "#6b7280", bg: "#f9fafb" };
                  const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                  return (
                    <div key={status}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "var(--es-ink)" }}>
                          {meta.label}
                        </span>
                        <span style={{
                          fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600,
                          color: meta.color,
                          background: meta.bg,
                          padding: "2px 8px", borderRadius: 2,
                        }}>
                          {count}
                        </span>
                      </div>
                      <div style={{ height: 5, background: "var(--es-bone)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: meta.color, borderRadius: 3, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ── Top products + Recent orders ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 24, marginBottom: 24, alignItems: "start" }}>
        {/* Top 5 products this month */}
        <div style={{ background: "var(--es-white)", padding: "28px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--es-mute)", margin: 0 }}>
              Top Products (30 Days)
            </p>
            <Link href="/admin/reports" style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "var(--es-plum)", textDecoration: "none" }}>
              Full report →
            </Link>
          </div>
          {loading ? (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)" }}>Loading…</p>
          ) : !reports || reports.top_products.length === 0 ? (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)" }}>No sales data yet</p>
          ) : (
            <div>
              {reports.top_products.map((p, i) => (
                <div key={p.name} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "11px 0",
                  borderBottom: i < reports.top_products.length - 1 ? "1px solid var(--es-bone)" : "none",
                }}>
                  <span style={{ fontFamily: "var(--font-bodoni)", fontSize: 20, color: "var(--es-gold)", width: 24, flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "var(--es-ink)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.name}
                    </p>
                    <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "var(--es-mute)", margin: "2px 0 0" }}>
                      {p.units_sold} units sold
                    </p>
                  </div>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "var(--es-plum)", flexShrink: 0 }}>
                    {kes(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div style={{ background: "var(--es-white)", padding: "28px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--es-mute)", margin: 0 }}>
              Recent Orders
            </p>
            <Link href="/admin/orders" style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "var(--es-plum)", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          {loading ? (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)" }}>Loading…</p>
          ) : !dash || dash.recent_orders.length === 0 ? (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)" }}>No orders yet</p>
          ) : (
            <div>
              {dash.recent_orders.map((order, i) => {
                const meta = STATUS_META[order.status] ?? { label: order.status, color: "#6b7280", bg: "#f9fafb" };
                return (
                  <Link key={order.id} href={`/admin/orders/${order.id}`} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 0",
                    borderBottom: i < dash.recent_orders.length - 1 ? "1px solid var(--es-bone)" : "none",
                    textDecoration: "none", gap: 8,
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "var(--es-ink)", margin: 0 }}>
                        {order.order_ref}
                      </p>
                      <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "var(--es-mute)", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={10} />
                        {new Date(order.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "var(--es-ink)" }}>
                        {kes(Number(order.total))}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-inter)", fontSize: 9,
                        letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600,
                        padding: "2px 7px", borderRadius: 2,
                        background: meta.bg, color: meta.color,
                      }}>
                        {meta.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Category breakdown ─────────────────────────────────────── */}
      {reports && reports.category_breakdown.length > 0 && (
        <div style={{ background: "var(--es-white)", padding: "28px 24px", marginBottom: 24 }}>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--es-mute)", margin: "0 0 20px" }}>
            Revenue by Category (30 Days)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {reports.category_breakdown.map(cat => {
              const pct = (cat.revenue / maxCatRev) * 100;
              return (
                <div key={cat.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 600, color: "var(--es-ink)" }}>{cat.name}</span>
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "var(--es-plum)", fontWeight: 600 }}>{kes(cat.revenue)}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--es-bone)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--es-gold)", borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "var(--es-mute)", margin: "4px 0 0" }}>
                    {cat.order_count} items sold
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Low stock table ────────────────────────────────────────── */}
      {reports && reports.low_stock.length > 0 && (
        <div style={{ background: "var(--es-white)", padding: "28px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "#dc2626", margin: 0 }}>
              Low Stock Alerts ({reports.low_stock.length})
            </p>
            <Link href="/admin/stock" style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#dc2626", textDecoration: "none" }}>
              Manage stock →
            </Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-inter)" }}>
              <thead>
                <tr style={{ background: "#fef2f2" }}>
                  {["Product", "SKU", "Size", "Qty"].map((col, i) => (
                    <th key={i} style={{
                      padding: "10px 16px", textAlign: i === 3 ? "right" : "left",
                      fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase",
                      color: "#dc2626", fontWeight: 600,
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.low_stock.map((item, idx) => (
                  <tr key={`${item.sku_code}-${idx}`} style={{ borderBottom: "1px solid var(--es-bone)" }}>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--es-ink)" }}>{item.product_name}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--es-mute)" }}>{item.sku_code}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--es-ink)" }}>{item.size}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}>
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        color: item.stock_quantity === 0 ? "#dc2626" : "#d97706",
                      }}>
                        {item.stock_quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Bottom navigation tiles ────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginTop: 8 }}>
        {[
          { href: "/admin/orders",            label: "Orders",            desc: "Manage all customer orders",   icon: ShoppingBag },
          { href: "/admin/products",          label: "Products",          desc: "Edit catalogue & inventory",   icon: Package },
          { href: "/admin/reports",           label: "Analytics",         desc: "Revenue, trends & exports",    icon: BarChart2 },
          { href: "/admin/finance",           label: "Finance",           desc: "P&L, expenses & loans",        icon: DollarSign },
          { href: "/admin/customers",         label: "Customers",         desc: "Customer profiles & history",  icon: TrendingUp },
          { href: "/admin/pos",               label: "POS",               desc: "In-store point of sale",       icon: Zap },
        ].map(tile => (
          <Link key={tile.href} href={tile.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--es-white)", border: "1px solid var(--es-bone)",
              padding: "18px 20px", cursor: "pointer",
              transition: "border-color 0.15s",
            }}>
              <tile.icon size={22} color="var(--es-plum)" style={{ marginBottom: 10 }} />
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 600, color: "var(--es-ink)", margin: "0 0 4px" }}>{tile.label}</p>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "var(--es-mute)", margin: 0 }}>{tile.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
