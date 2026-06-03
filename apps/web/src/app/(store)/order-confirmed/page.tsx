"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/checkout/CartProvider";
import Link from "next/link";

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "—";
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--es-paper)",
        fontFamily: "var(--font-inter)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        textAlign: "center",
      }}
    >
      {/* Checkmark circle */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          border: "3px solid var(--es-ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <svg
          width="44"
          height="44"
          viewBox="0 0 44 44"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 22.5L18.5 31L34 13"
            stroke="var(--es-ink)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Eyebrow */}
      <p
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: 11,
          letterSpacing: "0.45em",
          textTransform: "uppercase",
          color: "var(--es-gold)",
          marginBottom: 16,
        }}
      >
        Order Confirmed
      </p>

      {/* Heading */}
      <h1
        style={{
          fontFamily: "var(--font-bodoni)",
          fontSize: 48,
          fontWeight: 400,
          lineHeight: 1.1,
          color: "var(--es-ink)",
          margin: "0 0 16px",
        }}
      >
        Your order is placed.
      </h1>

      {/* Order ref */}
      <p
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: 14,
          color: "var(--es-mute)",
          marginBottom: 24,
          letterSpacing: "0.05em",
        }}
      >
        Order reference:{" "}
        <span style={{ color: "var(--es-ink)", fontWeight: 600 }}>{ref}</span>
      </p>

      {/* Body copy */}
      <p
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: 15,
          color: "var(--es-mute)",
          maxWidth: 440,
          lineHeight: 1.7,
          marginBottom: 48,
        }}
      >
        We&apos;ve sent your M-Pesa confirmation. Your order will be processed
        within 30 minutes.
      </p>

      {/* CTA */}
      <Link href="/products" className="es-btn-outline-ink">
        Continue Shopping
      </Link>
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "var(--es-paper)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      }
    >
      <OrderConfirmedContent />
    </Suspense>
  );
}
