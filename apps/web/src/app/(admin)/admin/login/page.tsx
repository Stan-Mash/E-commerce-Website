"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const from  = searchParams.get("from")  ?? "/admin";
  const error = searchParams.get("error") === "1";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-inter)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380, padding: "0 24px" }}>
        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{
            display: "block",
            fontFamily: "var(--font-bodoni), serif",
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

        {/*
          Native form POST — the browser handles the full request/redirect cycle,
          so Set-Cookie headers are applied before the next navigation starts.
          This is more reliable than fetch() + document.cookie + window.location.href,
          which can race against the PWA service worker.
        */}
        <form
          method="POST"
          action="/api/admin/auth"
          encType="application/x-www-form-urlencoded"
        >
          {/* Pass the destination so the server can redirect back there */}
          <input type="hidden" name="from" value={from} />

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

          {error && (
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

          <button
            type="submit"
            className="es-btn-plum"
            style={{ width: "100%" }}
          >
            Enter →
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
