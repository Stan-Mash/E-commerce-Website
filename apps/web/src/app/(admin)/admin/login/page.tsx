"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ── Font constant (matches the rest of admin UI) ────────────────────────────
const FONT = "var(--font-bodoni), var(--font-inter), serif";

function LoginForm() {
  const searchParams = useSearchParams();
  const from        = searchParams.get("from")  ?? "/admin";
  const hasError    = searchParams.get("error") === "1";

  return (
    <form
      action="/api/admin/auth"
      method="post"
      style={{ width: "100%", maxWidth: 380, padding: "0 24px" }}
    >
      {/* hidden redirect target */}
      <input type="hidden" name="from" value={from} />

      {/* Wordmark */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <span style={{
          display: "block",
          fontFamily: FONT,
          fontSize: 22,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "var(--es-gold)",
          marginBottom: 10,
        }}>
          Elite Style Co.
        </span>
        <span style={{
          display: "block",
          fontFamily: "var(--font-inter)",
          fontSize: 11,
          letterSpacing: "0.45em",
          textTransform: "uppercase",
          color: "var(--es-gold)",
          opacity: 0.7,
        }}>
          Admin Access
        </span>
      </div>

      {/* Password input */}
      <div style={{ marginBottom: 32 }}>
        <input
          type="password"
          name="password"
          placeholder="Enter admin password"
          required
          autoFocus
          style={{
            display: "block",
            width: "100%",
            padding: "12px 0",
            border: "none",
            borderBottom: "1px solid #333",
            background: "transparent",
            fontFamily: "var(--font-inter)",
            fontSize: 15,
            color: "#ffffff",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Error message (from ?error=1 redirect) */}
      {hasError && (
        <p style={{
          fontFamily: "var(--font-inter)",
          fontSize: 13,
          color: "#e53e3e",
          marginBottom: 20,
          marginTop: -16,
        }}>
          Incorrect password.
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="es-btn-plum"
        style={{ width: "100%" }}
      >
        Enter →
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-inter)",
    }}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
