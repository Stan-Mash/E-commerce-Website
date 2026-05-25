"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const FONT = "'Inter','Urbanist',sans-serif";

// Inner component that uses useSearchParams — must be inside <Suspense>
function LoginForm() {
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get("from") ?? "/admin/finance";

  // Redirect immediately if already authenticated
  useEffect(() => {
    fetch("/api/admin/finance/reports?month=2000-01")
      .then(r => { if (r.status !== 403) router.replace(from); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/admin/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await r.json() as { ok?: boolean; error?: string };
      if (r.ok && j.ok) {
        router.replace(from);
      } else {
        setError(j.error ?? "Incorrect password");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: 380, padding: "48px 40px", background: "#fff", borderRadius: 12 }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ width: 52, height: 52, background: "#7c3aed", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 900, color: "#111", margin: "0 0 6px" }}>Owner Access</h1>
        <p style={{ fontFamily: FONT, fontSize: 13, color: "#888", margin: 0 }}>Finance module — restricted to owner only</p>
      </div>

      <form onSubmit={handleLogin}>
        <label style={{ fontFamily: FONT, fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>
          Owner Password
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter owner password"
          autoFocus
          required
          style={{ display: "block", width: "100%", padding: "11px 14px", border: "1px solid #e0e0e0", borderRadius: 6, fontFamily: FONT, fontSize: 14, color: "#111", outline: "none", boxSizing: "border-box", marginBottom: error ? 8 : 16 }}
        />
        {error && (
          <p style={{ fontFamily: FONT, fontSize: 12, color: "#c0392b", margin: "0 0 12px" }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          style={{ width: "100%", padding: "12px 0", background: loading || !password ? "#ccc" : "#7c3aed", color: "#fff", border: "none", borderRadius: 6, fontFamily: FONT, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, cursor: loading || !password ? "not-allowed" : "pointer" }}
        >
          {loading ? "Verifying…" : "Unlock Finance"}
        </button>
      </form>

      <p style={{ fontFamily: FONT, fontSize: 11, color: "#ccc", textAlign: "center", marginTop: 24 }}>
        This area is not visible to staff members.
      </p>
    </div>
  );
}

export default function OwnerLoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f0f" }}>
      <Suspense fallback={
        <div style={{ width: 380, padding: "48px 40px", background: "#fff", borderRadius: 12, textAlign: "center" }}>
          <p style={{ fontFamily: FONT, fontSize: 13, color: "#888" }}>Loading…</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
