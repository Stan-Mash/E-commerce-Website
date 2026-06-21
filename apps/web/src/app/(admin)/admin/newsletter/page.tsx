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

  // Campaign composer state
  const [showComposer, setShowComposer] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; error?: string } | null>(null);

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

  async function sendCampaign() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html: `<p style="font-size:15px;line-height:1.7">${body.replace(/\n/g, "<br/>")}</p>` }),
      });
      const data = await res.json() as { sent?: number; failed?: number; error?: string };
      if (!res.ok) {
        setSendResult({ sent: 0, failed: 0, error: data.error ?? "Failed to send." });
      } else {
        setSendResult({ sent: data.sent ?? 0, failed: data.failed ?? 0 });
        if ((data.failed ?? 0) === 0) { setSubject(""); setBody(""); setShowComposer(false); }
      }
    } catch {
      setSendResult({ sent: 0, failed: 0, error: "Network error." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 8 }}>
            Marketing
          </p>
          <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 32, color: "var(--es-ink)" }}>
            Newsletter <span style={{ fontSize: 16, color: "var(--es-mute)" }}>({subscribers.length})</span>
          </h1>
        </div>
        <button
          onClick={() => { setShowComposer(true); setSendResult(null); }}
          className="es-btn-plum"
          disabled={subscribers.length === 0}
          style={{ opacity: subscribers.length === 0 ? 0.5 : 1 }}
        >
          Send Campaign
        </button>
      </div>

      {/* Campaign composer modal */}
      {showComposer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "var(--es-white)", borderRadius: 8, padding: "40px 36px", maxWidth: 560, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <h2 style={{ fontFamily: "var(--font-bodoni)", fontSize: 24, fontWeight: 400, color: "var(--es-ink)", margin: "0 0 4px" }}>
              Send Campaign
            </h2>
            <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)", margin: "0 0 24px" }}>
              Sending to {subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""}
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--es-mute)", marginBottom: 6 }}>Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. New Arrivals this Friday ✨"
                style={{ display: "block", width: "100%", padding: "10px 14px", border: "1px solid var(--es-bone)", borderRadius: 4, fontSize: 14, color: "var(--es-ink)", background: "var(--es-white)", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--es-mute)", marginBottom: 6 }}>Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="Write your message here. Keep it short and personal."
                style={{ display: "block", width: "100%", padding: "10px 14px", border: "1px solid var(--es-bone)", borderRadius: 4, fontSize: 14, color: "var(--es-ink)", background: "var(--es-white)", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>

            {sendResult && (
              <p style={{ fontSize: 13, marginBottom: 16, color: sendResult.error ? "#c0392b" : "#2e7d32" }}>
                {sendResult.error ?? `Sent to ${sendResult.sent} subscribers${sendResult.failed > 0 ? `, ${sendResult.failed} failed` : ""}.`}
              </p>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => void sendCampaign()}
                disabled={sending || !subject.trim() || !body.trim()}
                className="es-btn-plum"
                style={{ flex: 1, opacity: sending || !subject.trim() || !body.trim() ? 0.5 : 1 }}
              >
                {sending ? "Sending…" : "Send Now"}
              </button>
              <button
                onClick={() => { setShowComposer(false); setSendResult(null); }}
                style={{ flex: 1, padding: "10px 0", background: "transparent", color: "var(--es-ink)", border: "1px solid var(--es-bone)", borderRadius: 4, fontFamily: "var(--font-inter)", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


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
