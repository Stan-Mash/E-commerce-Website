"use client";

import { useEffect, useState, useCallback } from "react";

interface Subscriber {
  email: string;
  source: string | null;
  created_at: string;
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter", { credentials: "include" });
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      const data = await res.json();
      setSubscribers(data.subscribers ?? []);
      setMigrated(data.migrated !== false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const shown = subscribers.filter((s) => s.email.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 8 }}>
          Marketing
        </p>
        <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 32, color: "var(--es-ink)" }}>
          Newsletter <span style={{ fontSize: 16, color: "var(--es-mute)" }}>({subscribers.length})</span>
        </h1>
      </div>

      {!migrated && (
        <div style={{ marginBottom: 20, padding: "12px 16px", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 6, fontSize: 13, color: "#7a5c00" }}>
          The <code>newsletter_subscribers</code> table doesn&apos;t exist yet. Apply migration 014 in Supabase to start collecting signups.
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email…"
          style={{ flex: 1, minWidth: 200, padding: "9px 12px", border: "1px solid var(--es-bone)", borderRadius: 4, fontSize: 14 }}
        />
        <a
          href="/api/admin/newsletter?format=csv"
          className="es-btn-plum"
          style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", pointerEvents: subscribers.length === 0 ? "none" : "auto", opacity: subscribers.length === 0 ? 0.5 : 1 }}
        >
          Export CSV
        </a>
      </div>

      {loading ? (
        <p style={{ color: "var(--es-mute)" }}>Loading…</p>
      ) : shown.length === 0 ? (
        <p style={{ color: "var(--es-mute)" }}>{subscribers.length === 0 ? "No subscribers yet." : "No matches."}</p>
      ) : (
        <div style={{ border: "1px solid var(--es-bone)", borderRadius: 8, overflow: "hidden", background: "var(--es-white)" }}>
          {shown.map((s, i) => (
            <div
              key={s.email}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--es-bone)",
              }}
            >
              <span style={{ fontSize: 14, color: "var(--es-ink)" }}>{s.email}</span>
              <span style={{ fontSize: 12, color: "var(--es-mute)", whiteSpace: "nowrap" }}>
                {s.source ?? "—"} · {new Date(s.created_at).toLocaleDateString("en-KE")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
