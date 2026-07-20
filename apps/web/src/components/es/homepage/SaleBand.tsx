"use client";

import { useState } from "react";

export function SaleBand() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/equinox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: phone || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        setDone(true);
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-es-champagne-lt border-t border-b border-es-champagne/30 px-8 md:px-16 py-10">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center flex-wrap gap-7">
          <span className="font-sans text-[10px] tracking-label uppercase text-es-champagne-dk border border-es-champagne px-3.5 py-2">
            Private Preview
          </span>
          <div>
            <span className="font-cormorant text-[22px] md:text-[28px] font-semibold text-es-ink leading-tight tracking-[-0.02em] block">
              The Equinox Edit —{" "}
              <span className="text-es-champagne-dk italic">10 days only, by invitation.</span>
            </span>
            <span className="font-sans text-[13px] text-es-mute block mt-1.5 max-w-xl">
              A curated preview of next season&apos;s collection, opening two weeks before public
              launch. Reserving your spot gets you first access and an invitation email the
              moment doors open.
            </span>
          </div>
        </div>
        {!open && (
          <button onClick={() => setOpen(true)} className="es-btn-champagne" type="button">
            Reserve Access →
          </button>
        )}
      </div>

      {open && (
        <div className="mt-6 max-w-md">
          {done ? (
            <p className="font-sans text-[13px] text-es-champagne-dk font-semibold">
              You&apos;re on the list — we&apos;ll email you the moment the Equinox Edit opens.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-3 text-[13px] font-sans border border-es-champagne bg-white text-es-ink outline-none focus-visible:ring-2 focus-visible:ring-es-champagne-dk"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-3 text-[13px] font-sans border border-es-champagne bg-white text-es-ink outline-none focus-visible:ring-2 focus-visible:ring-es-champagne-dk"
              />
              <button type="submit" disabled={loading} className="es-btn-champagne whitespace-nowrap">
                {loading ? "Reserving…" : "Confirm"}
              </button>
            </form>
          )}
          {error && <p className="font-sans text-[12px] text-red-600 mt-2">{error}</p>}
        </div>
      )}
    </section>
  );
}
