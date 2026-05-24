"use client";

import { useState, useEffect } from "react";

interface Shift {
  id:            string;
  cashier_name:  string;
  location_id:   string;
  opening_float: number;
  closing_float: number | null;
  expected_float: number | null;
  variance:      number | null;
  status:        "open" | "closed";
  opened_at:     string;
  closed_at:     string | null;
}

function formatKES(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/pos/shifts")
      .then((r) => { if (r.status === 401) { window.location.href = "/admin/login"; throw new Error("401"); } return r.json(); })
      .then((j: { shift: Shift | null }) => {
        // Endpoint returns the currently open shift; for history we'd need a separate endpoint.
        // For now show any returned shift.
        setShifts(j.shift ? [j.shift] : []);
      })
      .catch(() => setShifts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 8 }}>
          Retail Operations
        </p>
        <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 36, fontWeight: 400, color: "var(--es-ink)", margin: 0 }}>
          Shift Management
        </h1>
      </div>

      <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "var(--es-mute)", marginBottom: 24, lineHeight: 1.6 }}>
        Shifts are opened and closed from the <a href="/admin/pos" style={{ color: "var(--es-plum)" }}>POS Terminal</a>.
        Each shift tracks opening cash float, cash sales, and closing count — the system calculates the expected float and any variance automatically.
      </p>

      {loading ? (
        <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "var(--es-mute)" }}>Loading…</p>
      ) : shifts.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center", fontFamily: "var(--font-inter)", fontSize: 14, color: "var(--es-mute)" }}>
          No shifts recorded yet. Open a shift from the POS Terminal to begin.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {shifts.map((s) => (
            <div key={s.id} style={{ background: "var(--es-white)", border: "1px solid var(--es-bone)", borderRadius: 8, padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 16, fontWeight: 600, color: "var(--es-ink)", margin: "0 0 4px" }}>
                    {s.cashier_name}
                  </p>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)", margin: 0 }}>
                    Opened {new Date(s.opened_at).toLocaleString("en-KE")}
                    {s.closed_at ? ` · Closed ${new Date(s.closed_at).toLocaleString("en-KE")}` : ""}
                  </p>
                </div>
                <span style={{
                  fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase",
                  padding: "4px 12px", borderRadius: 20,
                  background: s.status === "open" ? "#e8f5e9" : "var(--es-bone)",
                  color: s.status === "open" ? "#2e7d32" : "var(--es-mute)",
                  fontWeight: 600,
                }}>
                  {s.status}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16, marginTop: 20 }}>
                {[
                  { label: "Opening Float", value: formatKES(s.opening_float) },
                  { label: "Expected Float", value: s.expected_float != null ? formatKES(s.expected_float) : "—" },
                  { label: "Closing Count", value: s.closing_float != null ? formatKES(s.closing_float) : "—" },
                  {
                    label: "Variance",
                    value: s.variance != null ? formatKES(s.variance) : "—",
                    highlight: s.variance != null ? (s.variance < 0 ? "red" : s.variance > 0 ? "orange" : "green") : undefined,
                  },
                ].map(({ label, value, highlight }) => (
                  <div key={label} style={{ background: "var(--es-paper)", borderRadius: 6, padding: "12px 16px" }}>
                    <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--es-mute)", margin: "0 0 4px" }}>
                      {label}
                    </p>
                    <p style={{
                      fontFamily: "var(--font-inter)", fontSize: 18, fontWeight: 600, margin: 0,
                      color: highlight === "red" ? "#c0392b" : highlight === "orange" ? "#e67e22" : highlight === "green" ? "#27ae60" : "var(--es-ink)",
                    }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
