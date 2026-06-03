"use client";

import { useState } from "react";

type OrderStatus = "paid" | "processing" | "shipped" | "delivered";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type OrderData = {
  ref: string;
  status: OrderStatus;
  created_at: string;
  estimated_delivery: string | null;
  items: OrderItem[];
  phone: string;
};

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "paid", label: "Order Paid" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Ready / Shipped" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_ORDER: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

function getStepIndex(status: OrderStatus): number {
  return STATUS_ORDER.indexOf(status);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StatusStepper({ status }: { status: OrderStatus }) {
  const currentIndex = getStepIndex(status);

  return (
    <div className="w-full">
      <div className="flex items-start justify-between relative">
        {/* Connecting line */}
        <div
          className="absolute top-5 left-0 right-0 h-[2px] -z-0"
          style={{ background: "rgba(0,0,0,0.08)" }}
        />
        <div
          className="absolute top-5 left-0 h-[2px] -z-0 transition-all duration-500"
          style={{
            background: "var(--es-ink)",
            width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          const isPending = i > currentIndex;

          return (
            <div
              key={step.key}
              className="flex flex-col items-center gap-3 flex-1 relative"
            >
              {/* Circle */}
              <div
                className="w-10 h-10 flex items-center justify-center z-10 transition-all duration-300"
                style={{
                  borderRadius: "50%",
                  background: isDone
                    ? "var(--es-ink)"
                    : isActive
                    ? "var(--es-ink)"
                    : "#fff",
                  border: isPending
                    ? "2px solid rgba(0,0,0,0.15)"
                    : "2px solid var(--es-ink)",
                  color: isDone || isActive ? "#fff" : "rgba(0,0,0,0.3)",
                }}
              >
                {isDone ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isActive ? (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: "#c9a961" }}
                  />
                ) : (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: "rgba(0,0,0,0.15)" }}
                  />
                )}
              </div>

              {/* Label */}
              <p
                className="text-center text-[11px] tracking-[.05em] uppercase font-semibold leading-tight max-w-[80px]"
                style={{
                  color: isDone || isActive ? "#111" : "#aaa",
                }}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  const [phone, setPhone] = useState("");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOrder(null);
    setNotFound(false);
    setError(null);

    try {
      const params = new URLSearchParams({ phone, ref });
      const res = await fetch(`/api/track?${params.toString()}`);

      if (res.status === 404) {
        setNotFound(true);
        return;
      }

      if (!res.ok) throw new Error("Lookup failed");

      const data = await res.json();
      setOrder(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <title>Track Your Order | Elite Style Co.</title>

      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section
          className="relative flex flex-col items-center justify-center text-center px-6"
          style={{ height: "38vh", background: "var(--es-ink)", color: "#ffffff" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 50% 30%, rgba(201,169,97,0.12) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <p
            className="mb-6 text-[11px] tracking-[.48em] uppercase"
            style={{ color: "#c9a961" }}
          >
            Order Status
          </p>
          <h1
            className="text-4xl sm:text-6xl font-bold leading-none"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            Track Your Order
          </h1>
        </section>

        {/* Lookup form */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-[520px] px-6 py-12 sm:px-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold">
                  Phone Number <span style={{ color: "var(--es-ink)" }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 254700000000"
                  className="border border-[rgba(0,0,0,0.15)] px-4 py-3 text-[14px] text-es-ink placeholder:text-es-faint focus:outline-none focus:border-[var(--es-ink)] transition-colors"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
                <p className="text-[12px] text-es-faint">
                  The number used at checkout (without +, e.g. 254712345678)
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold">
                  Order Reference <span style={{ color: "var(--es-ink)" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ref}
                  onChange={(e) => setRef(e.target.value.toUpperCase())}
                  placeholder="e.g. ESC-001"
                  className="border border-[rgba(0,0,0,0.15)] px-4 py-3 text-[14px] text-es-ink placeholder:text-es-faint focus:outline-none focus:border-[var(--es-ink)] transition-colors"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
                <p className="text-[12px] text-es-faint">
                  Found in your order confirmation SMS
                </p>
              </div>

              {error && (
                <p className="text-[13px] text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="es-btn-plum w-full py-4 text-[11px] tracking-[.38em]"
              >
                {loading ? "Looking up…" : "Track Order"}
              </button>
            </form>
          </div>
        </section>

        {/* Not found state */}
        {notFound && (
          <section style={{ background: "#f7f7f7" }}>
            <div className="mx-auto w-full max-w-[520px] px-6 py-12 sm:px-8 text-center">
              <p
                className="mb-3 text-[11px] tracking-[.48em] uppercase"
                style={{ color: "#aaa" }}
              >
                No results
              </p>
              <h2
                className="mb-4 text-2xl font-bold text-es-ink"
                style={{ fontFamily: "var(--font-bodoni)" }}
              >
                Order not found
              </h2>
              <p className="text-[14px] leading-relaxed text-es-mute mb-6">
                We couldn&apos;t find an order matching those details. Please double-check
                your phone number and order reference, then try again.
              </p>
              <a
                href="https://wa.me/254700000000"
                target="_blank"
                rel="noopener noreferrer"
                className="es-btn-plum inline-flex px-8 py-3 text-[11px] tracking-[.38em]"
              >
                WhatsApp Support
              </a>
            </div>
          </section>
        )}

        {/* Order result */}
        {order && (
          <section style={{ background: "#f7f7f7" }}>
            <div className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8 sm:py-16">
              {/* Reference + date */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-10">
                <div>
                  <p
                    className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold mb-1"
                  >
                    Order reference
                  </p>
                  <p
                    className="text-2xl font-bold text-es-ink"
                    style={{ fontFamily: "var(--font-bodoni)" }}
                  >
                    {order.ref}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p
                    className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold mb-1"
                  >
                    Order placed
                  </p>
                  <p className="text-[14px] text-es-char">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>

              {/* Stepper */}
              <div className="mb-12">
                <StatusStepper status={order.status} />
              </div>

              {/* Estimated delivery */}
              {order.estimated_delivery && (
                <div
                  className="mb-8 p-5 flex gap-4 items-center"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <span style={{ color: "#c9a961" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold mb-0.5">
                      Estimated delivery
                    </p>
                    <p className="text-[14px] font-semibold text-es-ink">
                      {formatDate(order.estimated_delivery)}
                    </p>
                  </div>
                </div>
              )}

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <div>
                  <p className="mb-4 text-[11px] tracking-[.1em] uppercase text-es-mute font-semibold">
                    Items in this order
                  </p>
                  <div
                    className="divide-y"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.08)", borderBottom: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    {order.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-4"
                      >
                        <div>
                          <p className="text-[14px] font-medium text-es-ink">
                            {item.name}
                          </p>
                          <p className="text-[12px] text-es-mute">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-[14px] font-semibold text-es-ink">
                          KES {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 text-center">
                <p className="text-[13px] text-es-mute mb-4">
                  Need help with your order?
                </p>
                <a
                  href="/contact"
                  className="es-btn-outline-ink inline-flex px-8 py-3 text-[11px] tracking-[.38em]"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
