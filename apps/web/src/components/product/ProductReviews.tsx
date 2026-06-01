"use client";

import { useEffect, useState, useCallback } from "react";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
}

function Stars({ value, size = 16, onSelect }: { value: number; size?: number; onSelect?: (n: number) => void }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={onSelect ? () => onSelect(n) : undefined}
          style={{
            color: n <= value ? "#c9a961" : "#d8d2c6",
            fontSize: size,
            cursor: onSelect ? "pointer" : "default",
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<{ count: number; average: number }>({ count: 0, average: 0 });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setSummary(data.summary ?? { count: 0, average: 0 });
    } catch {
      // ignore
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) { setMessage("Please enter your name."); return; }
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, authorName: name.trim(), rating, title: title.trim() || undefined, body: bodyText.trim() || undefined }),
      });
      if (res.ok) {
        setMessage("Thank you! Your review will appear once approved.");
        setName(""); setTitle(""); setBodyText(""); setRating(5); setShowForm(false);
      } else {
        setMessage("Sorry, we couldn't submit your review. Please try again.");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-16 border-t border-es-bone pt-12">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h2 className="text-2xl text-es-ink" style={{ fontFamily: "var(--font-bodoni)" }}>
            Reviews
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <Stars value={Math.round(summary.average)} />
            <span className="text-sm text-es-mute">
              {summary.count > 0 ? `${summary.average} · ${summary.count} review${summary.count === 1 ? "" : "s"}` : "No reviews yet"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="es-btn-outline-ink px-6 py-3 text-[11px] tracking-[.3em] uppercase"
        >
          Write a review
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-10 max-w-xl flex flex-col gap-4 bg-es-white p-6">
          <div>
            <label className="text-[11px] tracking-[.2em] uppercase text-es-mute block mb-2">Your rating</label>
            <Stars value={rating} size={24} onSelect={setRating} />
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
            className="border border-es-bone p-3 text-sm bg-transparent outline-none" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)"
            className="border border-es-bone p-3 text-sm bg-transparent outline-none" />
          <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="Tell others what you think (optional)"
            rows={4} className="border border-es-bone p-3 text-sm bg-transparent outline-none resize-y" />
          <button type="submit" disabled={submitting} className="es-btn-plum self-start px-8">
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}

      {message && <p className="text-sm text-es-gold mb-8">{message}</p>}

      {reviews.length === 0 ? (
        <p className="text-sm text-es-mute" style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: 16 }}>
          Be the first to review this piece.
        </p>
      ) : (
        <ul className="flex flex-col gap-6">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-es-bone pb-6">
              <div className="flex items-center gap-3 mb-1">
                <Stars value={r.rating} size={14} />
                <span className="text-sm font-medium text-es-ink">{r.author_name}</span>
                <span className="text-xs text-es-mute">
                  {new Date(r.created_at).toLocaleDateString("en-KE")}
                </span>
              </div>
              {r.title && <p className="text-sm font-semibold text-es-ink">{r.title}</p>}
              {r.body && <p className="text-sm text-es-mute mt-1 leading-relaxed">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
