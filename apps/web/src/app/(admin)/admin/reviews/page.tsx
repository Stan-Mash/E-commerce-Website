"use client";

import { useEffect, useState, useCallback } from "react";

interface Review {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  created_at: string;
  product: { name: string; slug: string } | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews", { credentials: "include" });
      const data = await res.json();
      setReviews(data.reviews ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  // load is also called manually after approving/rejecting a review (see
  // below), not just from this mount effect — its setLoading(true) is
  // needed to re-show the loading state on those refreshes too, so it isn't
  // a redundant initializer we can delete.
  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  async function setApproved(id: string, is_approved: boolean) {
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_approved }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  const shown = reviews.filter((r) =>
    filter === "all" ? true : filter === "pending" ? !r.is_approved : r.is_approved
  );
  const pendingCount = reviews.filter((r) => !r.is_approved).length;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 8 }}>
          Moderation
        </p>
        <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 36, color: "var(--es-ink)", margin: 0 }}>
          Reviews
        </h1>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["pending", "approved", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "8px 18px", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase",
              border: "1px solid var(--es-bone)", cursor: "pointer",
              background: filter === f ? "var(--es-plum)" : "transparent",
              color: filter === f ? "#fff" : "var(--es-ink)",
            }}>
            {f}{f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--es-mute)" }}>Loading…</p>
      ) : shown.length === 0 ? (
        <p style={{ color: "var(--es-mute)" }}>No {filter} reviews.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {shown.map((r) => (
            <div key={r.id} style={{ background: "var(--es-white)", padding: 20, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ color: "#c9a961" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <strong style={{ fontSize: 14 }}>{r.author_name}</strong>
                  <span style={{ fontSize: 11, color: "var(--es-mute)" }}>
                    on {r.product?.name ?? "—"} · {new Date(r.created_at).toLocaleDateString("en-KE")}
                  </span>
                </div>
                {r.title && <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>{r.title}</p>}
                {r.body && <p style={{ fontSize: 13, color: "var(--es-mute)", margin: 0 }}>{r.body}</p>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {!r.is_approved ? (
                  <button onClick={() => setApproved(r.id, true)} className="es-btn-plum" style={{ padding: "8px 16px" }}>Approve</button>
                ) : (
                  <button onClick={() => setApproved(r.id, false)} style={{ padding: "8px 16px", border: "1px solid var(--es-bone)", background: "transparent", cursor: "pointer", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>Unpublish</button>
                )}
                <button onClick={() => remove(r.id)} style={{ padding: "8px 16px", border: "1px solid #f5c6c6", color: "#c0392b", background: "transparent", cursor: "pointer", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
