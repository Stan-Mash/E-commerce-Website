"use client";

import { useEffect, useState, useCallback } from "react";

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit", { credentials: "include" });
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      const data = await res.json();
      setEntries(data.entries ?? []);
      setMigrated(data.migrated !== false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 8 }}>
          Security
        </p>
        <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 32, color: "var(--es-ink)" }}>Activity Log</h1>
      </div>

      {!migrated && (
        <div style={{ marginBottom: 20, padding: "12px 16px", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 6, fontSize: 13, color: "#7a5c00" }}>
          The <code>admin_audit_log</code> table doesn&apos;t exist yet. Apply migration 015 in Supabase to start recording activity.
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--es-mute)" }}>Loading…</p>
      ) : entries.length === 0 ? (
        <p style={{ color: "var(--es-mute)" }}>No activity recorded yet.</p>
      ) : (
        <div style={{ border: "1px solid var(--es-bone)", borderRadius: 8, overflow: "hidden", background: "var(--es-white)" }}>
          {entries.map((e, i) => (
            <div key={e.id} style={{ display: "flex", gap: 14, padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid var(--es-bone)", alignItems: "baseline" }}>
              <span style={{ fontSize: 12, color: "var(--es-mute)", whiteSpace: "nowrap", width: 140 }}>
                {new Date(e.created_at).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--es-ink)", whiteSpace: "nowrap" }}>{e.actor}</span>
              <span style={{ fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--es-plum)", whiteSpace: "nowrap" }}>{e.action}</span>
              <span style={{ fontSize: 12, color: "var(--es-mute)", overflow: "hidden", textOverflow: "ellipsis" }}>
                {e.entity ? `${e.entity}${e.entity_id ? ` ${e.entity_id.slice(0, 8)}` : ""}` : ""}
                {e.detail ? ` · ${JSON.stringify(e.detail)}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
