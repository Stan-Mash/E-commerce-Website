"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = "/admin";
      } else {
        setError("Incorrect password.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-bodoni)",
              fontSize: 22,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--es-gold)",
              marginBottom: 10,
            }}
          >
            Elite Style Co.
          </span>
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              color: "var(--es-gold)",
              opacity: 0.7,
            }}
          >
            Admin Access
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Password input */}
          <div style={{ marginBottom: 32 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          {/* Error message */}
          {error && (
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 13,
                color: "#e53e3e",
                marginBottom: 20,
                marginTop: -16,
              }}
            >
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="es-btn-plum"
            style={{
              width: "100%",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Verifying..." : "Enter →"}
          </button>
        </form>
      </div>
    </div>
  );
}
