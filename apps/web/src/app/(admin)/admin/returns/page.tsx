"use client";

import { useEffect, useState, useCallback } from "react";

interface ReturnRow {
  id: string;
  order_id: string;
  reason: string;
  status: "requested" | "approved" | "rejected" | "refunded";
  resolution: "refund" | "store_credit" | "exchange" | null;
  amount: number | null;
  notes: string | null;
  created_at: string;
  order: { order_ref: string; phone: string; total: number; status: string } | null;
}

const STATUSES = ["requested", "approved", "rejected", "refunded"] as const;
const RESOLUTIONS = ["refund", "store_credit", "exchange"] as const;

function fmtKES(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "all">("open");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/returns", { credentials: "include" });
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      const data = await res.json();
      setReturns(data.returns ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch("/api/admin/returns", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    load();
  }

  async function refund(id: string) {
    if (!confirm("Send this refund to the customer's M-Pesa now?")) return;
    const res = await fetch("/api/admin/returns/refund", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnId: id }),
    });
    const data = await res.json();
    alert(res.ok ? (data.message ?? "Refund sent.") : (data.error ?? "Refund failed."));
    if (res.ok) load();
  }

  const shown = returns.filter((r) => (filter === "all" ? true : r.status === "requested" || r.status === "approved"));
  const openCount = returns.filter((r) => r.status === "requested").length;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 8 }}>
          Customer Care
        </p>
        <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 32, color: "var(--es-ink)" }}>
          Returns {openCount > 0 && <span style={{ fontSize: 14, color: "#c0392b" }}>({openCount} new)</span>}
        </h1>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["open", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 16px",
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              border: "1px solid var(--es-bone)",
              background: filter === f ? "var(--es-ink)" : "transparent",
              color: filter === f ? "#fff" : "var(--es-ink)",
              cursor: "pointer",
            }}
          >
            {f === "open" ? "Open" : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--es-mute)" }}>Loading…</p>
      ) : shown.length === 0 ? (
        <p style={{ color: "var(--es-mute)" }}>No returns to show.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {shown.map((r) => (
            <div key={r.id} style={{ border: "1px solid var(--es-bone)", borderRadius: 8, padding: 20, background: "var(--es-white)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                <div>
                  <p style={{ fontFamily: "var(--font-bodoni)", fontSize: 18, color: "var(--es-ink)" }}>
                    {r.order?.order_ref ?? "Unknown order"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--es-mute)" }}>
                    {r.order?.phone ?? "—"} · Order total {fmtKES(r.order?.total ?? null)} · {new Date(r.created_at).toLocaleDateString("en-KE")}
                  </p>
                </div>
                <span style={{
                  fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 4, height: "fit-content",
                  background: r.status === "requested" ? "#fff3cd" : r.status === "approved" ? "#d1ecf1" : r.status === "refunded" ? "#d4edda" : "#f8d7da",
                  color: "#333",
                }}>
                  {r.status}
                </span>
              </div>

              <p style={{ fontSize: 14, color: "var(--es-ink)", marginBottom: 4 }}><strong>Reason:</strong> {r.reason}</p>
              {r.notes && <p style={{ fontSize: 13, color: "var(--es-mute)", marginBottom: 12 }}>{r.notes}</p>}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 12 }}>
                <label style={{ fontSize: 12, color: "var(--es-mute)" }}>Status
                  <select value={r.status} onChange={(e) => patch(r.id, { status: e.target.value })} style={SELECT}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: "var(--es-mute)" }}>Resolution
                  <select value={r.resolution ?? ""} onChange={(e) => patch(r.id, { resolution: e.target.value || null })} style={SELECT}>
                    <option value="">—</option>
                    {RESOLUTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: "var(--es-mute)" }}>Refund amount
                  <input
                    type="number"
                    defaultValue={r.amount ?? ""}
                    onBlur={(e) => { const v = e.target.value === "" ? null : Number(e.target.value); if (v !== r.amount) patch(r.id, { amount: v }); }}
                    style={{ ...SELECT, width: 110 }}
                  />
                </label>
                {r.status !== "refunded" && (
                  <button
                    onClick={() => refund(r.id)}
                    className="es-btn-plum"
                    style={{ fontSize: 12, padding: "7px 14px", cursor: "pointer" }}
                  >
                    Refund via M-Pesa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SELECT: React.CSSProperties = {
  marginLeft: 8,
  padding: "6px 10px",
  border: "1px solid var(--es-bone)",
  borderRadius: 4,
  fontSize: 13,
  color: "var(--es-ink)",
  background: "var(--es-white)",
};
