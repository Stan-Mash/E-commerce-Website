"use client";

import { useState } from "react";
import Link from "next/link";

interface OrderRow {
  order_ref: string;
  status: string;
  total: number;
  delivery_type: string;
  created_at: string;
  tracking_number: string | null;
  courier: string | null;
  tracking_url: string | null;
}

function formatKES(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);
}

const STATUS_COLOR: Record<string, string> = {
  paid: "#2e7d32",
  processing: "#1565c0",
  shipped: "#6a1b9a",
  ready_for_pickup: "#6a1b9a",
  delivered: "#2e7d32",
  payment_failed: "#c0392b",
  cancelled: "#c0392b",
  pending_payment: "#b26a00",
};

export default function AccountPage() {
  const [phone, setPhone] = useState("");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/account/orders?phone=${encodeURIComponent(phone.trim())}&ref=${encodeURIComponent(ref.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders ?? []);
      } else {
        setError(data.error ?? "Could not load your orders.");
        setOrders(null);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-es-paper">
      <div className="mx-auto w-full max-w-[860px] px-6 py-12 sm:py-20">
        <p className="mb-3 text-[11px] tracking-[.48em] uppercase text-es-gold">My Account</p>
        <h1 className="mb-10 text-4xl sm:text-5xl font-bold leading-none tracking-tight text-es-ink" style={{ fontFamily: "var(--font-bodoni)" }}>
          My Orders
        </h1>

        {orders === null ? (
          <form onSubmit={(e) => void lookup(e)} className="max-w-md border border-es-bone bg-es-white p-6 sm:p-8 flex flex-col gap-5">
            <p className="text-[14px] text-es-mute leading-relaxed">
              Enter your phone number and any one of your order references to see your full order history.
            </p>
            <div>
              <label className="block text-[11px] tracking-[.3em] uppercase text-es-mute mb-2">Phone number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX"
                className="w-full border-b border-es-bone bg-transparent py-2 text-es-ink outline-none focus:border-es-ink" />
            </div>
            <div>
              <label className="block text-[11px] tracking-[.3em] uppercase text-es-mute mb-2">An order reference</label>
              <input value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder="NF-XXXX-XXXX"
                className="w-full border-b border-es-bone bg-transparent py-2 text-es-ink outline-none focus:border-es-ink" />
            </div>
            {error && <p className="text-[13px]" style={{ color: "#c0392b" }}>{error}</p>}
            <button type="submit" disabled={loading}
              className="es-btn-ink px-8 py-3 text-[11px] tracking-[.34em] uppercase self-start"
              style={{ opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Loading…" : "View my orders"}
            </button>
          </form>
        ) : orders.length === 0 ? (
          <p className="text-es-mute">No orders found for this number.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <button onClick={() => { setOrders(null); setRef(""); }} className="self-start text-[12px] tracking-[.1em] uppercase text-es-gold underline">
              ← Look up a different number
            </button>
            {orders.map((o) => (
              <div key={o.order_ref} className="border border-es-bone bg-es-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-es-ink font-bold" style={{ fontFamily: "var(--font-bodoni)", fontSize: 18 }}>{o.order_ref}</p>
                  <p className="text-[12px] text-es-mute">
                    {new Date(o.created_at).toLocaleDateString("en-KE")} · {formatKES(o.total)} · {o.delivery_type.replace(/_/g, " ")}
                  </p>
                  {o.tracking_number && (
                    <p className="text-[12px] text-es-mute mt-1">
                      {o.courier ? `${o.courier}: ` : "Tracking: "}{o.tracking_number}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] tracking-[.1em] uppercase font-semibold" style={{ color: STATUS_COLOR[o.status] ?? "#555" }}>
                    {o.status.replace(/_/g, " ")}
                  </span>
                  <Link href={`/track?ref=${encodeURIComponent(o.order_ref)}`} className="text-[12px] tracking-[.1em] uppercase text-es-ink underline">
                    Track
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <PrivacySettings />
      </div>
    </main>
  );
}

function PrivacySettings() {
  const [status, setStatus] = useState<"idle" | "deleting" | "done">("idle");

  async function deletePhotos() {
    setStatus("deleting");
    try {
      await fetch("/api/tryon/delete-my-photos", { method: "POST" });
    } catch {
      // best-effort — the 24h cleanup cron is the backstop either way
    } finally {
      setStatus("done");
    }
  }

  return (
    <div className="mt-14 pt-10 border-t border-es-bone">
      <p className="mb-2 text-[11px] tracking-[.3em] uppercase text-es-mute">Privacy</p>
      <p className="text-[13px] text-es-mute mb-4 max-w-md">
        If you&apos;ve used &ldquo;See it on you&rdquo; try-on, your photos are auto-deleted within
        24 hours. You can also delete them immediately.
      </p>
      <button
        onClick={() => void deletePhotos()}
        disabled={status !== "idle"}
        className="es-btn-outline-ink text-[11px] tracking-[.2em] uppercase"
      >
        {status === "done" ? "Photos deleted" : status === "deleting" ? "Deleting…" : "Delete my try-on photos now"}
      </button>
    </div>
  );
}
