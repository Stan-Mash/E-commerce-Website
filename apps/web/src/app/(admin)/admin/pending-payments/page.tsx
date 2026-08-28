"use client";

import { useEffect, useState, useCallback } from "react";

interface PendingOrder {
  id: string;
  orderRef: string;
  phone: string;
  email: string | null;
  total: number;
  createdAt: string;
  expectedAmount: number;
  mpesaReceipt: string | null;
  customerReportedCode: string | null;
  customerReportedAt: string | null;
}

function fmtKES(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function PendingPaymentsPage() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/pending-buy-goods", { credentials: "include" });
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      const data = await res.json();
      setOrders(data.orders ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  // load is also called manually after confirming/rejecting a payment (see
  // below), not just from this mount effect — its setLoading(true) is
  // needed to re-show the loading state on those refreshes too, so it isn't
  // a redundant initializer we can delete.
  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  async function act(orderId: string, action: "confirm" | "reject") {
    const verb = action === "confirm" ? "confirm this order as paid" : "reject this payment and restore stock";
    if (!confirm(`Are you sure you want to ${verb}? Only confirm after verifying the payment in the Safaricom portal.`)) return;
    setActingId(orderId);
    try {
      const res = await fetch("/api/admin/orders/pending-buy-goods", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Could not update this order. Please try again.");
        return;
      }
      await load();
    } finally {
      setActingId(null);
    }
  }

  const reportedCount = orders.filter((o) => o.customerReportedCode).length;
  const sorted = [...orders].sort((a, b) => {
    const aHas = a.customerReportedCode ? 1 : 0;
    const bHas = b.customerReportedCode ? 1 : 0;
    if (aHas !== bHas) return bHas - aHas;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 8 }}>
          Payments
        </p>
        <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 32, color: "var(--es-ink)" }}>
          Pending Buy Goods {reportedCount > 0 && <span style={{ fontSize: 14, color: "#c0392b" }}>({reportedCount} reported)</span>}
        </h1>
        <p style={{ fontSize: 13, color: "var(--es-mute)", marginTop: 8 }}>
          Orders awaiting M-Pesa confirmation. Verify the payment in the Safaricom Business Portal before confirming.
        </p>
      </div>

      {loading ? (
        <p style={{ color: "var(--es-mute)" }}>Loading…</p>
      ) : sorted.length === 0 ? (
        <p style={{ color: "var(--es-mute)" }}>No orders awaiting payment confirmation.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sorted.map((o) => {
            const acting = actingId === o.id;
            return (
              <div
                key={o.id}
                style={{
                  border: o.customerReportedCode ? "1.5px solid var(--es-gold)" : "1px solid var(--es-bone)",
                  borderRadius: 8,
                  padding: 20,
                  background: "var(--es-white)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-bodoni)", fontSize: 18, color: "var(--es-ink)" }}>
                      {o.orderRef}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--es-mute)" }}>
                      {o.phone} · {fmtKES(o.expectedAmount)} · {timeAgo(o.createdAt)}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4,
                    height: "fit-content", background: "#fff3cd", color: "#333",
                  }}>
                    pending
                  </span>
                </div>

                {o.customerReportedCode ? (
                  <div style={{ background: "#fdf8ee", border: "1px solid var(--es-gold)", borderRadius: 4, padding: "10px 14px", marginBottom: 16 }}>
                    <p style={{ fontSize: 12, color: "var(--es-mute)", marginBottom: 2 }}>Customer-reported M-Pesa code</p>
                    <p style={{ fontFamily: "var(--font-bodoni)", fontSize: 16, color: "var(--es-ink)", letterSpacing: "0.05em" }}>
                      {o.customerReportedCode}
                    </p>
                  </div>
                ) : o.mpesaReceipt ? (
                  <p style={{ fontSize: 13, color: "var(--es-mute)", marginBottom: 16 }}>
                    Webhook-matched receipt: <strong>{o.mpesaReceipt}</strong>
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--es-mute)", marginBottom: 16 }}>
                    No code reported yet — check the Safaricom portal manually.
                  </p>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button
                    onClick={() => act(o.id, "confirm")}
                    disabled={acting}
                    className="es-btn-plum"
                    style={{ fontSize: 12, padding: "7px 14px", cursor: acting ? "not-allowed" : "pointer", opacity: acting ? 0.6 : 1 }}
                  >
                    {acting ? "…" : "Confirm Paid"}
                  </button>
                  <button
                    onClick={() => act(o.id, "reject")}
                    disabled={acting}
                    style={{
                      fontSize: 12, padding: "7px 14px", cursor: acting ? "not-allowed" : "pointer", opacity: acting ? 0.6 : 1,
                      background: "transparent", border: "1px solid #c0392b", color: "#c0392b",
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
