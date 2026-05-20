"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface OrderDetail {
  id: string;
  order_ref: string;
  status: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  delivery_type: string;
  phone: string;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  customers: {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
  } | null;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    skus: {
      id: string;
      sku_code: string;
      size: string;
      color: string | null;
      products: {
        id: string;
        name: string;
        base_price: number;
      } | null;
    } | null;
  }>;
  mpesa_transactions: Array<{
    id: string;
    mpesa_receipt_number: string | null;
    amount_paid: number | null;
    status: string;
    transaction_date: string | null;
  }>;
}

const STATUS_OPTIONS = [
  "pending_payment",
  "paid",
  "payment_failed",
  "processing",
  "ready_for_pickup",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

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

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Props {
  params: { id: string };
}

export default function OrderDetailPage({ params }: Props) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/orders/${params.id}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const json = await res.json() as { order: OrderDetail };
        setOrder(json.order);
        setNewStatus(json.order.status);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.id]);

  async function handleStatusSave() {
    if (!order || newStatus === order.status) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
        setSaveMsg("Status updated.");
      }
    } catch {
      setSaveMsg("Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-inter)", color: "var(--es-mute)" }}>Loading order…</p>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ fontFamily: "var(--font-inter)", color: "var(--es-mute)" }}>Order not found.</p>
        <Link href="/admin/orders" style={{ color: "var(--es-plum)", fontFamily: "var(--font-inter)" }}>
          ← Back to orders
        </Link>
      </div>
    );
  }

  const badge = STATUS_STYLES[order.status] ?? { background: "#fafafa", color: "#757575" };
  const mpesa = order.mpesa_transactions?.[0] ?? null;

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <Link
          href="/admin/orders"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--es-mute)",
            textDecoration: "none",
          }}
        >
          ← Orders
        </Link>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "12px 0 0",
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: 32,
              fontWeight: 400,
              color: "var(--es-ink)",
              margin: 0,
            }}
          >
            {order.order_ref}
          </h1>
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: 3,
              background: badge.background,
              color: badge.color,
            }}
          >
            {order.status.replace(/_/g, " ")}
          </span>
        </div>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 13,
            color: "var(--es-mute)",
            marginTop: 8,
          }}
        >
          Placed{" "}
          {new Date(order.created_at).toLocaleString("en-KE", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          {" "}· {order.delivery_type === "pickup" ? "Store Pickup" : "Door Delivery"}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start" }}>
        {/* Left: order items */}
        <div>
          <div
            style={{
              background: "var(--es-white)",
              padding: "28px 32px",
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
                margin: "0 0 20px",
              }}
            >
              Order Items
            </p>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--es-bone)" }}>
                  {["Product", "Size", "Qty", "Unit Price", "Subtotal"].map((col, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "8px 0",
                        textAlign: i >= 2 ? "right" : "left",
                        fontFamily: "var(--font-inter)",
                        fontSize: 10,
                        letterSpacing: "0.25em",
                        textTransform: "uppercase",
                        color: "var(--es-mute)",
                        fontWeight: 500,
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--es-bone)" }}>
                    <td style={{ padding: "14px 0" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-bodoni)",
                          fontSize: 15,
                          color: "var(--es-ink)",
                        }}
                      >
                        {item.skus?.products?.name ?? "Unknown Product"}
                      </span>
                      {item.skus?.sku_code && (
                        <p
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 11,
                            color: "var(--es-mute)",
                            margin: "2px 0 0",
                          }}
                        >
                          {item.skus.sku_code}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: "14px 8px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: "var(--es-mute)",
                        }}
                      >
                        {item.skus?.size ?? "—"}{item.skus?.color ? ` / ${item.skus.color}` : ""}
                      </span>
                    </td>
                    <td style={{ padding: "14px 0", textAlign: "right" }}>
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-ink)" }}>
                        {item.quantity}
                      </span>
                    </td>
                    <td style={{ padding: "14px 0", textAlign: "right" }}>
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-ink)" }}>
                        {formatKES(Number(item.unit_price))}
                      </span>
                    </td>
                    <td style={{ padding: "14px 0", textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--es-ink)",
                        }}
                      >
                        {formatKES(Number(item.subtotal))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ marginTop: 20, borderTop: "1px solid var(--es-bone)", paddingTop: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-inter)",
                  fontSize: 13,
                  color: "var(--es-mute)",
                  marginBottom: 8,
                }}
              >
                <span>Subtotal</span>
                <span>{formatKES(Number(order.subtotal))}</span>
              </div>
              {Number(order.delivery_fee) > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "var(--font-inter)",
                    fontSize: 13,
                    color: "var(--es-mute)",
                    marginBottom: 8,
                  }}
                >
                  <span>Delivery</span>
                  <span>{formatKES(Number(order.delivery_fee))}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-bodoni)",
                  fontSize: 20,
                  color: "var(--es-ink)",
                  fontWeight: 400,
                  borderTop: "1px solid var(--es-bone)",
                  paddingTop: 12,
                  marginTop: 4,
                }}
              >
                <span>Total</span>
                <span>{formatKES(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* M-Pesa receipt */}
          {mpesa && mpesa.mpesa_receipt_number && (
            <div
              style={{
                background: "#e8f5e9",
                border: "1px solid #a5d6a7",
                borderRadius: 4,
                padding: "16px 20px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#2e7d32",
                  margin: "0 0 8px",
                }}
              >
                M-Pesa Receipt
              </p>
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--es-ink)",
                  margin: 0,
                }}
              >
                {mpesa.mpesa_receipt_number}
              </p>
              {mpesa.amount_paid != null && (
                <p
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 13,
                    color: "#2e7d32",
                    margin: "4px 0 0",
                  }}
                >
                  {formatKES(Number(mpesa.amount_paid))} paid
                  {mpesa.transaction_date ? ` · ${mpesa.transaction_date}` : ""}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Customer */}
          <div style={{ background: "var(--es-white)", padding: "24px 28px" }}>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "var(--es-mute)",
                margin: "0 0 16px",
              }}
            >
              Customer
            </p>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                color: "var(--es-ink)",
                margin: "0 0 4px",
                fontWeight: 600,
              }}
            >
              {order.customers?.name ?? "Guest"}
            </p>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 13,
                color: "var(--es-mute)",
                margin: 0,
              }}
            >
              {order.phone}
            </p>
            {order.customers?.email && (
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 13,
                  color: "var(--es-mute)",
                  margin: "4px 0 0",
                }}
              >
                {order.customers.email}
              </p>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ background: "var(--es-white)", padding: "24px 28px" }}>
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "var(--es-mute)",
                  margin: "0 0 12px",
                }}
              >
                Notes
              </p>
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 13,
                  color: "var(--es-mute)",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {order.notes}
              </p>
            </div>
          )}

          {/* Status update */}
          <div style={{ background: "var(--es-white)", padding: "24px 28px" }}>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "var(--es-mute)",
                margin: "0 0 16px",
              }}
            >
              Update Status
            </p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--es-bone)",
                borderRadius: 4,
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                color: "var(--es-ink)",
                background: "var(--es-white)",
                marginBottom: 12,
                cursor: "pointer",
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <button
              onClick={() => void handleStatusSave()}
              disabled={saving || newStatus === order.status}
              className="es-btn-plum"
              style={{
                width: "100%",
                opacity: saving || newStatus === order.status ? 0.5 : 1,
                cursor: saving || newStatus === order.status ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving…" : "Save Status"}
            </button>
            {saveMsg && (
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                  color: saveMsg.includes("Failed") ? "#c0392b" : "#2e7d32",
                  margin: "8px 0 0",
                  textAlign: "center",
                }}
              >
                {saveMsg}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
