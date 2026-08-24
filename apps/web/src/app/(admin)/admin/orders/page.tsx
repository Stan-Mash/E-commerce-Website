"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  pending_payment:  { background: "#fff8e1", color: "#f57f17" },
  paid:             { background: "#e8f5e9", color: "#2e7d32" },
  payment_failed:   { background: "#fde8e8", color: "#c0392b" },
  processing:       { background: "#e3f2fd", color: "#1565c0" },
  ready_for_pickup: { background: "#e8f5e9", color: "#2e7d32" },
  shipped:          { background: "#e8f5e9", color: "#2e7d32" },
  delivered:        { background: "#e8f5e9", color: "#2e7d32" },
  cancelled:        { background: "#fde8e8", color: "#c0392b" },
  refunded:         { background: "#fafafa", color: "#757575" },
};

const EDITABLE_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "ready_for_pickup",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending_payment" },
  { label: "Paid", value: "paid" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
];

const PAGE_SIZE = 20;

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Per-row status state: idle | saving | success | error
type RowStatusState = "idle" | "saving" | "success" | "error";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Per-row inline status editing state
  const [rowStatuses, setRowStatuses] = useState<Record<string, string>>({});
  const [rowSaveState, setRowSaveState] = useState<Record<string, RowStatusState>>({});

  const loadOrders = useCallback(() => {
    fetch("/api/admin/orders")
      .then(async (res) => {
        if (res.status === 401) { window.location.href = "/admin/login"; return; }
        if (res.ok) {
          const json = await res.json() as { orders: OrderRow[] };
          const fetched = json.orders ?? [];
          setOrders(fetched);
          // Initialise per-row status map
          const initial: Record<string, string> = {};
          fetched.forEach((o) => { initial[o.id] = o.status; });
          setRowStatuses(initial);
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Reset to page 1 when tab or search changes
  const [prevFilters, setPrevFilters] = useState({ activeTab, search });
  if (prevFilters.activeTab !== activeTab || prevFilters.search !== search) {
    setPrevFilters({ activeTab, search });
    setPage(1);
  }

  // Filter by tab then search
  const filtered = useMemo(() => {
    let list = activeTab ? orders.filter((o) => o.status === activeTab) : orders;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const ref  = o.order_ref.toLowerCase();
        const phone = (o.phone ?? "").toLowerCase();
        const name  = (o.customers?.name ?? "").toLowerCase();
        return ref.includes(q) || phone.includes(q) || name.includes(q);
      });
    }
    return list;
  }, [orders, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageEnd    = Math.min(pageStart + PAGE_SIZE, filtered.length);
  const pageItems  = filtered.slice(pageStart, pageEnd);

  async function handleStatusChange(orderId: string, newStatus: string) {
    setRowStatuses((prev) => ({ ...prev, [orderId]: newStatus }));
    setRowSaveState((prev) => ({ ...prev, [orderId]: "saving" }));
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        setRowSaveState((prev) => ({ ...prev, [orderId]: "success" }));
        setTimeout(() => {
          setRowSaveState((prev) => ({ ...prev, [orderId]: "idle" }));
        }, 2000);
      } else {
        // Revert on failure
        setRowStatuses((prev) => ({
          ...prev,
          [orderId]: orders.find((o) => o.id === orderId)?.status ?? newStatus,
        }));
        setRowSaveState((prev) => ({ ...prev, [orderId]: "error" }));
        setTimeout(() => {
          setRowSaveState((prev) => ({ ...prev, [orderId]: "idle" }));
        }, 3000);
      }
    } catch {
      setRowStatuses((prev) => ({
        ...prev,
        [orderId]: orders.find((o) => o.id === orderId)?.status ?? newStatus,
      }));
      setRowSaveState((prev) => ({ ...prev, [orderId]: "error" }));
      setTimeout(() => {
        setRowSaveState((prev) => ({ ...prev, [orderId]: "idle" }));
      }, 3000);
    }
  }

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
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

        {/* Export CSV */}
        <a
          href={activeTab ? `/api/admin/orders/export?status=${activeTab}` : "/api/admin/orders/export"}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-inter)",
            fontSize: 12,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "9px 18px",
            border: "1px solid var(--es-bone)",
            borderRadius: 4,
            background: "var(--es-white)",
            color: "var(--es-ink)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </a>
      </div>

      {/* Search bar */}
      <div
        style={{
          position: "relative",
          marginBottom: 28,
        }}
      >
        {/* Magnifying glass icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--es-mute)",
            pointerEvents: "none",
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by order ref or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            paddingLeft: 28,
            paddingRight: 12,
            paddingTop: 10,
            paddingBottom: 10,
            border: "none",
            borderBottom: "1px solid var(--es-bone)",
            background: "transparent",
            fontFamily: "var(--font-inter)",
            fontSize: 14,
            color: "var(--es-ink)",
            outline: "none",
          }}
        />
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
            ) : pageItems.length === 0 ? (
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
                      {search ? "No orders match your search." : "No orders yet."}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 14,
                        color: "var(--es-mute)",
                        lineHeight: 1.6,
                      }}
                    >
                      {search
                        ? "Try a different order ref, phone, or name."
                        : "Orders will appear here once customers start checking out."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pageItems.map((order, index) => {
                const isEven = index % 2 === 0;
                const currentStatus = rowStatuses[order.id] ?? order.status;
                const badge = STATUS_STYLES[currentStatus] ?? { background: "#fafafa", color: "#757575" };
                const saveState: RowStatusState = rowSaveState[order.id] ?? "idle";

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

                    {/* Status cell: badge + inline select + feedback icon */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
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
                          {currentStatus.replace(/_/g, " ")}
                        </span>

                        <select
                          value={currentStatus}
                          disabled={saveState === "saving"}
                          onChange={(e) => void handleStatusChange(order.id, e.target.value)}
                          title="Change status"
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 11,
                            color: "var(--es-ink)",
                            background: "var(--es-white)",
                            border: "1px solid var(--es-bone)",
                            borderRadius: 3,
                            padding: "3px 6px",
                            cursor: saveState === "saving" ? "not-allowed" : "pointer",
                            opacity: saveState === "saving" ? 0.6 : 1,
                            maxWidth: 130,
                          }}
                        >
                          {EDITABLE_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>

                        {/* Feedback indicator */}
                        {saveState === "saving" && (
                          <span
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: 11,
                              color: "var(--es-mute)",
                            }}
                          >
                            …
                          </span>
                        )}
                        {saveState === "success" && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#2e7d32"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {saveState === "error" && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#c0392b"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                      </div>
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

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 28,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              color: "var(--es-mute)",
              margin: 0,
            }}
          >
            Showing {pageStart + 1}–{pageEnd} of {filtered.length} orders
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 12,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "8px 16px",
                border: "1px solid var(--es-bone)",
                borderRadius: 3,
                background: safePage === 1 ? "var(--es-bone)" : "var(--es-white)",
                color: safePage === 1 ? "var(--es-mute)" : "var(--es-ink)",
                cursor: safePage === 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Prev
            </button>

            <span
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 13,
                color: "var(--es-ink)",
                padding: "0 8px",
                whiteSpace: "nowrap",
              }}
            >
              Page {safePage} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 12,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "8px 16px",
                border: "1px solid var(--es-bone)",
                borderRadius: 3,
                background: safePage === totalPages ? "var(--es-bone)" : "var(--es-white)",
                color: safePage === totalPages ? "var(--es-mute)" : "var(--es-ink)",
                cursor: safePage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
