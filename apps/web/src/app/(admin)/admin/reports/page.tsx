"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportsData {
  revenue_period: number;
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

type Preset = "today" | "week" | "month" | "last_month" | "all";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getPresetRange(preset: Preset): { from: string | null; to: string | null } {
  const now = new Date();
  const today = toDateStr(now);

  if (preset === "today") {
    return { from: today, to: today };
  }
  if (preset === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return { from: toDateStr(from), to: today };
  }
  if (preset === "month") {
    return { from: `${today.slice(0, 7)}-01`, to: today };
  }
  if (preset === "last_month") {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: toDateStr(d), to: toDateStr(lastDay) };
  }
  // all
  return { from: null, to: null };
}

const PRESET_LABELS: Record<Preset, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  last_month: "Last Month",
  all: "All Time",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  payment_failed: "Payment Failed",
  processing: "Processing",
  ready_for_pickup: "Ready for Pickup",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function statusColor(status: string): string {
  if (["delivered", "paid"].includes(status)) return "#27ae60";
  if (["processing", "ready_for_pickup", "shipped"].includes(status)) return "#e67e22";
  if (["cancelled", "payment_failed", "refunded"].includes(status)) return "#e74c3c";
  return "#7f8c8d";
}

// ---------------------------------------------------------------------------
// SVG bar chart for daily/weekly revenue
// ---------------------------------------------------------------------------

function DailyRevenueChart({
  data,
  isWeekly,
}: {
  data: Array<{ date: string; revenue: number }>;
  isWeekly: boolean;
}) {
  const W = 680;
  const H = 120;
  const PAD_LEFT = 8;
  const PAD_RIGHT = 8;
  const PAD_TOP = 10;
  const PAD_BOTTOM = 28;

  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const barCount = data.length;
  const gap = Math.max(1, Math.floor(chartW / barCount) * 0.15);
  const barW = Math.max(2, (chartW - gap * (barCount - 1)) / barCount);

  // Label every Nth bar to avoid crowding
  const labelEvery = barCount <= 10 ? 1 : barCount <= 20 ? 2 : barCount <= 31 ? 3 : 4;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      aria-label="Revenue bar chart"
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = PAD_TOP + chartH * (1 - t);
        return (
          <line
            key={t}
            x1={PAD_LEFT}
            x2={W - PAD_RIGHT}
            y1={y}
            y2={y}
            stroke="#ede8e4"
            strokeWidth={1}
          />
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max(2, (d.revenue / maxRev) * chartH);
        const x = PAD_LEFT + i * (barW + gap);
        const y = PAD_TOP + chartH - barH;
        const isZero = d.revenue === 0;

        // Date label
        const dateObj = new Date(d.date + "T00:00:00");
        const label = isWeekly
          ? dateObj.toLocaleDateString("en-KE", { month: "short", day: "numeric" })
          : dateObj.toLocaleDateString("en-KE", { day: "numeric", month: "short" }).replace(" ", " ");

        const showLabel = i % labelEvery === 0;

        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill={isZero ? "#ede8e4" : "#6b2d5e"}
              rx={1}
            />
            {showLabel && (
              <text
                x={x + barW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize={9}
                fill="#9e8c80"
                fontFamily="var(--font-inter)"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Date range state
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  // Derive effective range
  const effectiveRange = useCustom && customFrom && customTo
    ? { from: customFrom, to: customTo }
    : getPresetRange(preset);

  const load = useCallback(async (from: string | null, to: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to)   params.set("to", to);
      const url = `/api/admin/reports${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      if (res.ok) {
        const json = await res.json() as ReportsData;
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(effectiveRange.from, effectiveRange.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, effectiveRange.from, effectiveRange.to]);

  const totalOrders = data
    ? Object.values(data.orders_by_status).reduce((s, n) => s + n, 0)
    : 0;

  const maxCatRevenue = data
    ? Math.max(...data.category_breakdown.map((c) => c.revenue), 1)
    : 1;

  // Export URL with current date range
  const exportUrl = (() => {
    const p = new URLSearchParams();
    if (effectiveRange.from) p.set("from", effectiveRange.from);
    if (effectiveRange.to)   p.set("to", effectiveRange.to);
    return `/api/admin/orders/export${p.toString() ? `?${p.toString()}` : ""}`;
  })();

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const sectionLabel: React.CSSProperties = {
    fontFamily: "var(--font-inter)",
    fontSize: 11,
    letterSpacing: "0.4em",
    textTransform: "uppercase",
    color: "var(--es-mute)",
    margin: "0 0 20px",
  };

  const card: React.CSSProperties = {
    background: "var(--es-white)",
    padding: "24px 28px",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
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
            Analytics
          </p>
          <h1
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: 36,
              fontWeight: 400,
              color: "var(--es-ink)",
              margin: 0,
            }}
          >
            Reports
          </h1>
        </div>

        {/* Export button */}
        <a
          href={exportUrl}
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 12,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--es-white)",
            background: "var(--es-plum)",
            padding: "10px 20px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14 }}>&#8595;</span> Export Report
        </a>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Date range filter                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          background: "var(--es-white)",
          padding: "20px 24px",
          marginBottom: 36,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Preset buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(Object.keys(PRESET_LABELS) as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPreset(p); setUseCustom(false); }}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "7px 14px",
                border: "1px solid",
                borderColor: !useCustom && preset === p ? "var(--es-plum)" : "var(--es-bone)",
                background: !useCustom && preset === p ? "var(--es-plum)" : "transparent",
                color: !useCustom && preset === p ? "var(--es-white)" : "var(--es-ink)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: "var(--es-bone)", flexShrink: 0 }} />

        {/* Custom date inputs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "var(--es-mute)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Custom
          </span>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => { setCustomFrom(e.target.value); setUseCustom(true); }}
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 12,
              padding: "6px 10px",
              border: "1px solid",
              borderColor: useCustom ? "var(--es-plum)" : "var(--es-bone)",
              background: "transparent",
              color: "var(--es-ink)",
              outline: "none",
            }}
          />
          <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "var(--es-mute)" }}>to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => { setCustomTo(e.target.value); setUseCustom(true); }}
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 12,
              padding: "6px 10px",
              border: "1px solid",
              borderColor: useCustom ? "var(--es-plum)" : "var(--es-bone)",
              background: "transparent",
              color: "var(--es-ink)",
              outline: "none",
            }}
          />
          {useCustom && customFrom && customTo && (
            <button
              onClick={() => void load(customFrom, customTo)}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "7px 14px",
                border: "1px solid var(--es-plum)",
                background: "var(--es-plum)",
                color: "var(--es-white)",
                cursor: "pointer",
              }}
            >
              Apply
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--font-inter)", color: "var(--es-mute)", fontSize: 14 }}>
          Loading reports…
        </p>
      ) : !data ? (
        <p style={{ fontFamily: "var(--font-inter)", color: "var(--es-mute)", fontSize: 14 }}>
          Could not load reports.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

          {/* ---------------------------------------------------------------- */}
          {/* Revenue summary cards                                             */}
          {/* ---------------------------------------------------------------- */}
          <section>
            <p style={sectionLabel}>Revenue Summary</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 20,
              }}
            >
              {[
                // Only show "Selected Period" card when it's a custom range or Last Month
                // (other presets duplicate one of the fixed cards below)
                ...(useCustom || preset === "last_month"
                  ? [{ label: useCustom ? "Custom Period" : "Last Month", value: data.revenue_period, highlight: true }]
                  : []),
                { label: "Today", value: data.revenue_today, highlight: !useCustom && preset === "today" },
                { label: "This Week", value: data.revenue_week, highlight: !useCustom && preset === "week" },
                { label: "This Month", value: data.revenue_month, highlight: !useCustom && preset === "month" },
                { label: "All Time", value: data.revenue_all_time, highlight: !useCustom && preset === "all" },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    background: "var(--es-white)",
                    padding: "24px 20px",
                    borderTop: `3px solid ${card.highlight ? "var(--es-gold)" : "var(--es-plum)"}`,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-bodoni)",
                      fontSize: 26,
                      fontWeight: 400,
                      color: card.highlight ? "var(--es-gold)" : "var(--es-plum)",
                      margin: "0 0 8px",
                      lineHeight: 1.1,
                    }}
                  >
                    {formatKES(card.value)}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: 11,
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      color: "var(--es-mute)",
                      margin: 0,
                    }}
                  >
                    {card.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Daily / weekly revenue mini-chart                                */}
          {/* ---------------------------------------------------------------- */}
          {data.daily_revenue.length > 0 && (
            <section>
              <p style={sectionLabel}>
                {data.is_weekly_buckets ? "Weekly Revenue" : "Daily Revenue"}
                {effectiveRange.from && effectiveRange.to && (
                  <span style={{ marginLeft: 12, fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>
                    {effectiveRange.from} — {effectiveRange.to}
                  </span>
                )}
              </p>
              <div style={{ ...card, padding: "24px 24px 16px" }}>
                <DailyRevenueChart data={data.daily_revenue} isWeekly={data.is_weekly_buckets} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "var(--es-mute)" }}>
                    Max {formatKES(Math.max(...data.daily_revenue.map((d) => d.revenue)))}
                  </span>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "var(--es-mute)" }}>
                    Total {formatKES(data.daily_revenue.reduce((s, d) => s + d.revenue, 0))}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Orders by status + Top products (2-col)                          */}
          {/* ---------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 32 }}>

            {/* Orders by status */}
            <section>
              <p style={sectionLabel}>Orders by Status</p>
              <div style={card}>
                {Object.entries(data.orders_by_status).length === 0 ? (
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "var(--es-mute)" }}>
                    No orders in this period.
                  </p>
                ) : (
                  Object.entries(data.orders_by_status)
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => {
                      const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                      const color = statusColor(status);
                      return (
                        <div key={status} style={{ marginBottom: 16 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 5,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-inter)",
                                fontSize: 12,
                                color: "var(--es-ink)",
                              }}
                            >
                              {STATUS_LABELS[status] ?? status.replace(/_/g, " ")}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-inter)",
                                fontSize: 11,
                                fontWeight: 600,
                                color: color,
                                minWidth: 72,
                                textAlign: "right",
                              }}
                            >
                              {count} &nbsp;<span style={{ fontWeight: 400, color: "var(--es-mute)" }}>({pct.toFixed(0)}%)</span>
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 7,
                              background: "var(--es-bone)",
                              borderRadius: 4,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: color,
                                borderRadius: 4,
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </section>

            {/* Top products */}
            <section>
              <p style={sectionLabel}>Top 5 Products by Revenue</p>
              <div style={card}>
                {data.top_products.length === 0 ? (
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "var(--es-mute)" }}>
                    No sales data in this period.
                  </p>
                ) : (
                  data.top_products.map((product, i) => (
                    <div
                      key={product.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "12px 0",
                        borderBottom: i < data.top_products.length - 1 ? "1px solid var(--es-bone)" : "none",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-bodoni)",
                          fontSize: 22,
                          color: "var(--es-gold)",
                          width: 28,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--es-ink)",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {product.name}
                        </p>
                        <p
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 11,
                            color: "var(--es-mute)",
                            margin: "2px 0 0",
                          }}
                        >
                          {product.units_sold} units sold
                        </p>
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--es-ink)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {formatKES(product.revenue)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Category breakdown                                                */}
          {/* ---------------------------------------------------------------- */}
          {data.category_breakdown.length > 0 && (
            <section>
              <p style={sectionLabel}>Category Breakdown</p>
              <div style={card}>
                {data.category_breakdown.map((cat) => {
                  const pct = (cat.revenue / maxCatRevenue) * 100;
                  return (
                    <div key={cat.name} style={{ marginBottom: 18 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--es-ink)",
                          }}
                        >
                          {cat.name}
                        </span>
                        <span style={{ display: "flex", gap: 16, alignItems: "center" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: 11,
                              color: "var(--es-mute)",
                            }}
                          >
                            {cat.order_count} items
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--es-plum)",
                            }}
                          >
                            {formatKES(cat.revenue)}
                          </span>
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: 8,
                          background: "var(--es-bone)",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: "var(--es-gold)",
                            borderRadius: 4,
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Low stock alerts                                                  */}
          {/* ---------------------------------------------------------------- */}
          {data.low_stock.length > 0 && (
            <section>
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "#c0392b",
                  margin: "0 0 20px",
                }}
              >
                Low Stock Alerts ({data.low_stock.length})
              </p>
              <div style={{ background: "var(--es-white)", padding: 0, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-inter)" }}>
                  <thead>
                    <tr style={{ background: "#fde8e8" }}>
                      {["Product", "SKU Code", "Size", "Stock"].map((col, i) => (
                        <th
                          key={i}
                          style={{
                            padding: "12px 20px",
                            textAlign: i === 3 ? "right" : "left",
                            fontFamily: "var(--font-inter)",
                            fontSize: 10,
                            letterSpacing: "0.25em",
                            textTransform: "uppercase",
                            color: "#c0392b",
                            fontWeight: 600,
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.low_stock.map((item, index) => (
                      <tr
                        key={`${item.sku_code}-${index}`}
                        style={{ background: index % 2 === 0 ? "var(--es-white)" : "#fff5f5" }}
                      >
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-ink)" }}>
                            {item.product_name}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "var(--es-mute)" }}>
                            {item.sku_code}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-ink)" }}>
                            {item.size}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px", textAlign: "right" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: 14,
                              fontWeight: 700,
                              color: item.stock_quantity === 0 ? "#c0392b" : "#f57f17",
                            }}
                          >
                            {item.stock_quantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
