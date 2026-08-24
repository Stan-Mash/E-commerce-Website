"use client";

import { useEffect, useState, useCallback } from "react";

interface PickupPoint {
  id: string;
  name: string;
  area: string;
  address: string | null;
  phone: string | null;
  fee: number;
  active: boolean;
}

const INPUT: React.CSSProperties = {
  padding: "9px 12px",
  border: "1px solid var(--es-bone)",
  borderRadius: 4,
  fontSize: 13,
  color: "var(--es-ink)",
  background: "var(--es-white)",
};

export default function AdminDeliveryPage() {
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(true);
  const [form, setForm] = useState({ name: "", area: "", address: "", phone: "", fee: "0" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pickup-points", { credentials: "include" });
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      const data = await res.json();
      setPoints(data.points ?? []);
      setMigrated(data.migrated !== false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pickup-points", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fee: Number(form.fee) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add pickup point.");
      } else {
        setForm({ name: "", area: "", address: "", phone: "", fee: "0" });
        load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch("/api/admin/pickup-points", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    load();
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 8 }}>
          Logistics
        </p>
        <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 32, color: "var(--es-ink)" }}>
          Delivery &amp; Pickup Points
        </h1>
        <p style={{ fontSize: 13, color: "var(--es-mute)", marginTop: 8, maxWidth: 560 }}>
          Agent locations customers can collect from (e.g. Pickup Mtaani shops). Active points appear in checkout when the customer chooses pickup; each point can have its own handling fee.
        </p>
      </div>

      {!migrated && (
        <div style={{ marginBottom: 20, padding: "12px 16px", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 6, fontSize: 13, color: "#7a5c00" }}>
          The <code>pickup_points</code> table doesn&apos;t exist yet. Apply migration 017 in Supabase first.
        </div>
      )}

      <form onSubmit={(e) => void add(e)} style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28, alignItems: "flex-end" }}>
        <input style={{ ...INPUT, width: 180 }} placeholder="Name (e.g. Mtaani – Moi Ave)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input style={{ ...INPUT, width: 130 }} placeholder="Area (e.g. CBD)" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        <input style={{ ...INPUT, width: 200 }} placeholder="Address (optional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input style={{ ...INPUT, width: 140 }} placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input style={{ ...INPUT, width: 100 }} type="number" min={0} placeholder="Fee KES" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
        <button type="submit" disabled={saving || !migrated} className="es-btn-plum" style={{ cursor: saving ? "not-allowed" : "pointer", opacity: saving || !migrated ? 0.6 : 1 }}>
          {saving ? "Adding…" : "Add point"}
        </button>
      </form>
      {error && <p style={{ color: "#c0392b", fontSize: 13, marginTop: -16, marginBottom: 20 }}>{error}</p>}

      {loading ? (
        <p style={{ color: "var(--es-mute)" }}>Loading…</p>
      ) : points.length === 0 ? (
        <p style={{ color: "var(--es-mute)" }}>No pickup points yet — add your first above.</p>
      ) : (
        <div style={{ border: "1px solid var(--es-bone)", borderRadius: 8, overflow: "hidden", background: "var(--es-white)" }}>
          {points.map((p, i) => (
            <div key={p.id} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid var(--es-bone)", opacity: p.active ? 1 : 0.5 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--es-ink)" }}>{p.name}</p>
                <p style={{ fontSize: 12, color: "var(--es-mute)" }}>
                  {p.area}{p.address ? ` · ${p.address}` : ""}{p.phone ? ` · ${p.phone}` : ""}
                </p>
              </div>
              <label style={{ fontSize: 12, color: "var(--es-mute)" }}>Fee KES
                <input
                  type="number"
                  min={0}
                  defaultValue={p.fee}
                  onBlur={(e) => { const v = Math.max(0, Number(e.target.value)); if (v !== p.fee) patch(p.id, { fee: v }); }}
                  style={{ ...INPUT, width: 90, marginLeft: 8 }}
                />
              </label>
              <button
                onClick={() => patch(p.id, { active: !p.active })}
                style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", padding: "7px 14px", border: "1px solid var(--es-bone)", borderRadius: 4, background: "transparent", color: p.active ? "#c0392b" : "#2e7d32", cursor: "pointer" }}
              >
                {p.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
