"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface OrderRow {
  id: string;
  order_ref: string;
  status: string;
  total: number;
  phone: string;
  created_at: string;
  order_items: Array<{ id: string }>;
  customers: { phone: string; name: string | null } | null;
}

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  pending_payment: { background: "#fff8e1", color: "#f57f17" },
  paid:            { background: "#e8f5e9", color: "#2e7d32" },
  payment_failed:  { background: "#fde8e8", color: "#c0392b" },
  processing:      { background: "#e3f2fd", color: "#1565c0" },
  ready_for_pickup:{ background: "#e8f5e9", color: "#2e7d32" },
  shipped:         { background: "#e8f5e9", color: "#2e7d32" },
  delivered:       { background: "#e8f5e9", color: "#2e7d32" },
  cancelled:       { background: "#fde8e8", color: "#c0392b" },
  refunded:        { background: "#fafafa", color: "#757575" },
};

const TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending_payment" },
  { label: "Paid", value: "paid" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
];

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      if (res.ok) {
        const json = await res.json() as { orders: OrderRow[] };
        setOrders(json.orders ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const filtered = activeTab
    ? orders.filter((o) => o.status === activeTab)
    : orders;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
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
          Sales
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
          Orders
        </h1>
      </div>

      {/* Status tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 32,
          borderBottom: "2px solid var(--es-bone)",
          flexWrap: "wrap",
        }}
      >
        {TABS.map((tab) => {
          const count = tab.value
            ? orders.filter((o) => o.status === tab.value).length
            : orders.length;
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                padding: "10px 20px",
                background: "none",
                border: "none",
                borderBottom: isActive
                  ? "2px solid var(--es-plum)"
                  : "2px solid transparent",
                marginBottom: -2,
                color: isActive ? "var(--es-plum)" : "var(--es-mute)",
                cursor: "pointer",
                fontWeight: isActive ? 600 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  background: isActive ? "var(--es-plum-lt)" : "var(--es-bone)",
                  color: isActive ? "var(--es-plum)" : "var(--es-mute)",
                  padding: "2px 6px",
                  borderRadius: 10,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-inter)",
          }}
        >
          <thead>
            <tr style={{ background: "var(--es-ink)" }}>
              {["Order Ref", "Date", "Phone", "Items", "Total", "Status", ""].map((col, i) => (
                <th
                  key={i}
                  style={{
                    padding: "14px 20px",
                    textAlign: "left",
                    fontFamily: "var(--font-inter)",
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "#ffffff",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "48px 20px",
                    textAlign: "center",
                    background: "var(--es-white)",
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    color: "var(--es-mute)",
                  }}
                >
                  Loading orders…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "48px 20px",
                    textAlign: "center",
                    background: "var(--es-white)",
                    border: "1px solid var(--es-bone)",
                  }}
                >
                  <div style={{ maxWidth: 400, margin: "0 auto", padding: "24px" }}>
                    <p
                      style={{
                        fontFamily: "var(--font-bodoni)",
                        fontStyle: "italic",
                        fontSize: 22,
                        color: "var(--es-ink)",
                        marginBottom: 12,
                      }}
                    >
                      No orders yet.
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 14,
                        color: "var(--es-mute)",
                        lineHeight: 1.6,
                      }}
                    >
                      Orders will appear here once customers start checking out.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((order, index) => {
                const isEven = index % 2 === 0;
                const badge = STATUS_STYLES[order.status] ?? { background: "#fafafa", color: "#757575" };

                return (
                  <tr
                    key={order.id}
                    style={{ background: isEven ? "var(--es-white)" : "var(--es-paper)" }}
                  >
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--es-ink)",
                        }}
                      >
                        {order.order_ref}
                      </span>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: "var(--es-mute)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(order.created_at).toLocaleDateString("en-KE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: "var(--es-ink)",
                        }}
                      >
                        {order.customers?.name
                          ? `${order.customers.name} · ${order.phone}`
                          : order.phone}
                      </span>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: "var(--es-mute)",
                        }}
                      >
                        {order.order_items.length}
                      </span>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--es-ink)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatKES(Number(order.total))}
                      </span>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          fontFamily: "var(--font-inter)",
                          fontSize: 10,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: 2,
                          background: badge.background,
                          color: badge.color,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 12,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "var(--es-plum)",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
