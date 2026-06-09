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
  tracking_number?: string | null;
  courier?: string | null;
  tracking_url?: string | null;
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

const TRACK_INPUT: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid var(--es-bone)",
  borderRadius: 4,
  fontSize: 13,
  color: "var(--es-ink)",
  background: "var(--es-paper)",
};

export default function OrderDetailPage({ params }: Props) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);

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
        setTrackingNumber(json.order.tracking_number ?? "");
        setCourier(json.order.courier ?? "");
        setTrackingUrl(json.order.tracking_url ?? "");
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
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
        setSaveMsg({ text: "Status updated successfully.", ok: true });
        setTimeout(() => setSaveMsg(null), 3000);
      } else {
        setSaveMsg({ text: "Failed to update status.", ok: false });
      }
    } catch {
      setSaveMsg({ text: "Failed to update status.", ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleTrackingSave() {
    if (!order) return;
    setSavingTracking(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_number: trackingNumber, courier, tracking_url: trackingUrl }),
      });
      if (res.ok) {
        setOrder((prev) => prev ? { ...prev, tracking_number: trackingNumber, courier, tracking_url: trackingUrl } : prev);
        setSaveMsg({ text: "Tracking saved.", ok: true });
        setTimeout(() => setSaveMsg(null), 3000);
      } else {
        const d = await res.json().catch(() => ({}));
        setSaveMsg({ text: d.error ?? "Failed to save tracking.", ok: false });
      }
    } catch {
      setSaveMsg({ text: "Failed to save tracking.", ok: false });
    } finally {
      setSavingTracking(false);
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
          Back to orders
        </Link>
      </div>
    );
  }

  const badge = STATUS_STYLES[order.status] ?? { background: "#fafafa", color: "#757575" };
  const mpesa = order.mpesa_transactions?.[0] ?? null;
  const paymentMethod = mpesa?.mpesa_receipt_number
    ? `M-Pesa · ${mpesa.mpesa_receipt_number}`
    : mpesa
    ? "M-Pesa"
    : "Unknown";

  return (
    <>
      {/* Print-only styles injected as a style tag */}
      <style>{`
        @media print {
          /* Hide everything in the admin layout except .print-receipt */
          body * { visibility: hidden !important; }
          .print-receipt, .print-receipt * { visibility: visible !important; }
          .print-receipt {
            position: fixed !important;
            inset: 0 !important;
            padding: 32px !important;
            background: #fff !important;
            font-family: Arial, sans-serif !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 900 }}>
        {/* Header */}
        <div className="no-print" style={{ marginBottom: 40 }}>
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
            Orders
          </Link>
        </div>

        {/* Title row with action buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
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

          {/* Action buttons */}
          <div className="no-print" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Quick status change */}
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 13,
                color: "var(--es-ink)",
                background: "var(--es-white)",
                border: "1px solid var(--es-bone)",
                borderRadius: 4,
                padding: "8px 12px",
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
                opacity: saving || newStatus === order.status ? 0.5 : 1,
                cursor: saving || newStatus === order.status ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {saving ? "Saving…" : "Save Status"}
            </button>
            <button
              onClick={() => window.print()}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 12,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "9px 18px",
                border: "1px solid var(--es-bone)",
                borderRadius: 4,
                background: "var(--es-white)",
                color: "var(--es-ink)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Print
            </button>
          </div>
        </div>

        {/* Status save feedback */}
        {saveMsg && (
          <div className="no-print" style={{ marginBottom: 16 }}>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 12,
                color: saveMsg.ok ? "#2e7d32" : "#c0392b",
                margin: 0,
                padding: "8px 14px",
                background: saveMsg.ok ? "#e8f5e9" : "#fde8e8",
                borderRadius: 4,
                display: "inline-block",
              }}
            >
              {saveMsg.text}
            </p>
          </div>
        )}

        {/* Shipment tracking */}
        <div className="no-print" style={{ border: "1px solid var(--es-bone)", borderRadius: 8, padding: 20, marginBottom: 32, background: "var(--es-white)" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--es-mute)", marginBottom: 14 }}>
            Shipment tracking
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
            <input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Courier (e.g. G4S, Fargo)" style={TRACK_INPUT} />
            <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking / waybill number" style={TRACK_INPUT} />
            <input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="Tracking URL (optional)" style={TRACK_INPUT} />
          </div>
          <button
            onClick={() => void handleTrackingSave()}
            disabled={savingTracking}
            className="es-btn-plum"
            style={{ opacity: savingTracking ? 0.5 : 1, cursor: savingTracking ? "not-allowed" : "pointer" }}
          >
            {savingTracking ? "Saving…" : "Save Tracking"}
          </button>
        </div>

        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 13,
            color: "var(--es-mute)",
            marginTop: 8,
            marginBottom: 40,
          }}
        >
          Placed{" "}
          {new Date(order.created_at).toLocaleString("en-KE", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          {" · "}
          {order.delivery_type === "pickup" ? "Store Pickup" : "Door Delivery"}
          {" · "}
          {paymentMethod}
        </p>

        {/* Printable receipt — always rendered, only visible on screen/print */}
        <div className="print-receipt">
          {/* Print header */}
          <div
            style={{
              display: "none",
              borderBottom: "2px solid #111",
              paddingBottom: 16,
              marginBottom: 24,
            }}
            className="print-only-header"
          >
            <style>{`
              @media print {
                .print-only-header { display: block !important; }
              }
            `}</style>
            <p style={{ fontFamily: "Arial, sans-serif", fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>
              Elite Style Co.
            </p>
            <p style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#555", margin: 0 }}>
              Order Receipt · {order.order_ref}
            </p>
            <p style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#555", margin: "4px 0 0" }}>
              Date:{" "}
              {new Date(order.created_at).toLocaleString("en-KE", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
            <p style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#555", margin: "4px 0 0" }}>
              Customer: {order.customers?.name ?? "Guest"} · {order.phone}
            </p>
            <p style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#555", margin: "4px 0 0" }}>
              Delivery: {order.delivery_type === "pickup" ? "Store Pickup" : "Door Delivery"}
              {" · "}Payment: {paymentMethod}
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
                      {["Product / SKU", "Size", "Qty", "Unit Price", "Subtotal"].map((col, i) => (
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
                              display: "block",
                            }}
                          >
                            {item.skus?.products?.name ?? "Unknown Product"}
                          </span>
                          {item.skus?.sku_code && (
                            <span
                              style={{
                                fontFamily: "var(--font-inter)",
                                fontSize: 11,
                                color: "var(--es-mute)",
                                display: "block",
                                marginTop: 2,
                              }}
                            >
                              {item.skus.sku_code}
                            </span>
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
                            {item.skus?.size ?? "—"}
                            {item.skus?.color ? ` / ${item.skus.color}` : ""}
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

              {/* Order info */}
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
                  Order Details
                </p>
                {[
                  ["Ref", order.order_ref],
                  [
                    "Date",
                    new Date(order.created_at).toLocaleString("en-KE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }),
                  ],
                  ["Delivery", order.delivery_type === "pickup" ? "Store Pickup" : "Door Delivery"],
                  ["Payment", paymentMethod],
                  ["Status", order.status.replace(/_/g, " ")],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 12,
                        color: "var(--es-mute)",
                        textTransform: "capitalize",
                        flexShrink: 0,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 12,
                        color: "var(--es-ink)",
                        textAlign: "right",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
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

              {/* Status update panel (screen only) */}
              <div className="no-print" style={{ background: "var(--es-white)", padding: "24px 28px" }}>
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
                      color: saveMsg.ok ? "#2e7d32" : "#c0392b",
                      margin: "8px 0 0",
                      textAlign: "center",
                    }}
                  >
                    {saveMsg.text}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
