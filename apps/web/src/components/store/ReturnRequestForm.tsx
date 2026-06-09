"use client";

import { useState } from "react";

export default function ReturnRequestForm() {
  const [orderRef, setOrderRef] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone("");
    if (orderRef.trim().length < 3 || reason.trim().length < 5) {
      setError("Please enter your order reference and a reason (at least a few words).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderRef: orderRef.trim(), reason: reason.trim(), notes: notes.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(data.message ?? "Return request received. We'll be in touch shortly.");
        setOrderRef("");
        setReason("");
        setNotes("");
      } else {
        setError(data.error ?? "Could not submit your return. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="border border-es-bone bg-es-white p-8 text-center">
        <p className="text-es-gold text-[11px] tracking-[.4em] uppercase mb-3">Request received</p>
        <p className="text-es-ink" style={{ fontFamily: "var(--font-cormorant)", fontSize: 20 }}>{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="border border-es-bone bg-es-white p-6 sm:p-8 flex flex-col gap-5">
      <div>
        <label className="block text-[11px] tracking-[.3em] uppercase text-es-mute mb-2">Order reference</label>
        <input
          value={orderRef}
          onChange={(e) => setOrderRef(e.target.value.toUpperCase())}
          placeholder="ESC-XXXX"
          className="w-full border-b border-es-bone bg-transparent py-2 text-es-ink outline-none focus:border-es-ink"
        />
      </div>
      <div>
        <label className="block text-[11px] tracking-[.3em] uppercase text-es-mute mb-2">Reason for return</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Wrong size, changed my mind, faulty item…"
          className="w-full border-b border-es-bone bg-transparent py-2 text-es-ink outline-none focus:border-es-ink"
        />
      </div>
      <div>
        <label className="block text-[11px] tracking-[.3em] uppercase text-es-mute mb-2">Additional notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border border-es-bone bg-transparent p-3 text-es-ink outline-none focus:border-es-ink resize-none"
        />
      </div>
      {error && <p className="text-[13px]" style={{ color: "#c0392b" }}>{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="es-btn-ink px-8 py-3 text-[11px] tracking-[.34em] uppercase self-start"
        style={{ opacity: submitting ? 0.6 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
      >
        {submitting ? "Submitting…" : "Submit return request"}
      </button>
    </form>
  );
}
