"use client";

import { useState, useEffect, useCallback } from "react";

interface ReportsData {
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  revenue_all_time: number;
  orders_by_status: Record<string, number>;
  top_products: Array<{ name: string; units_sold: number; revenue: number }>;
  low_stock: Array<{ product_name: string; sku_code: string; size: string; stock_quantity: number }>;
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

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

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports");
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
    void load();
  }, [load]);

  const REVENUE_CARDS = data
    ? [
        { label: "Today", value: data.revenue_today },
        { label: "This Week", value: data.revenue_week },
        { label: "This Month", value: data.revenue_month },
        { label: "All Time", value: data.revenue_all_time },
      ]
    : [];

  const totalOrders = data
    ? Object.values(data.orders_by_status).reduce((s, n) => s + n, 0)
    : 0;

  return (
    <div>
      {/* Header */}
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
          {/* Revenue summary */}
          <section>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: "var(--es-mute)",
                margin: "0 0 20px",
              }}
            >
              Revenue Summary
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 20,
              }}
            >
              {REVENUE_CARDS.map((card) => (
                <div
                  key={card.label}
                  style={{
                    background: "var(--es-white)",
                    padding: "24px 20px",
                    borderTop: "3px solid var(--es-plum)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-bodoni)",
                      fontSize: 26,
                      fontWeight: 400,
                      color: "var(--es-plum)",
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            {/* Orders by status */}
            <section>
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "var(--es-mute)",
                  margin: "0 0 20px",
                }}
              >
                Orders by Status
              </p>
              <div style={{ background: "var(--es-white)", padding: "24px 28px" }}>
                {Object.entries(data.orders_by_status).length === 0 ? (
                  <p
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: 14,
                      color: "var(--es-mute)",
                    }}
                  >
                    No orders yet.
                  </p>
                ) : (
                  Object.entries(data.orders_by_status)
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => {
                      const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                      return (
                        <div key={status} style={{ marginBottom: 14 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 5,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-inter)",
                                fontSize: 12,
                                color: "var(--es-ink)",
                                textTransform: "capitalize",
                              }}
                            >
                              {STATUS_LABELS[status] ?? status.replace(/_/g, " ")}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-inter)",
                                fontSize: 12,
                                fontWeight: 600,
                                color: "var(--es-ink)",
                              }}
                            >
                              {count}
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: 6,
                              background: "var(--es-bone)",
                              borderRadius: 3,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: "var(--es-plum)",
                                borderRadius: 3,
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
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "var(--es-mute)",
                  margin: "0 0 20px",
                }}
              >
                Top 5 Products by Revenue
              </p>
              <div style={{ background: "var(--es-white)", padding: "24px 28px" }}>
                {data.top_products.length === 0 ? (
                  <p
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: 14,
                      color: "var(--es-mute)",
                    }}
                  >
                    No sales data yet.
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

          {/* Low stock alerts */}
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
              <div style={{ background: "var(--es-white)", padding: 0, overflow: "hidden" }}>
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
