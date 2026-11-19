"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const from  = searchParams.get("from")  ?? "/admin";
  const errorParam = searchParams.get("error");
  const error = errorParam === "1";
  const sessionExpired = errorParam === "session";
  const [showPw, setShowPw] = useState(false);

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

          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              name="operator"
              placeholder="Your name (for the activity log)"
              autoComplete="off"
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

          <div style={{ marginBottom: 32, position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              name="password"
              placeholder="Enter admin password"
              required
              autoFocus
              style={{
                display: "block",
                width: "100%",
                padding: "12px 36px 12px 0",
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
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#666",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <EyeIcon open={showPw} />
            </button>
          </div>

          {sessionExpired && (
            <p style={{
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              color: "#e09000",
              marginBottom: 20,
              marginTop: -16,
            }}>
              Your session expired. Please sign in again.
            </p>
          )}

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
