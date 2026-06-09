"use client";

import { useEffect } from "react";

// Scrubs the stale esc_admin_token from localStorage left by the old
// (pre-HttpOnly) admin auth flow. Auth now uses the admin_session cookie.
export default function AdminSessionSync() {
  useEffect(() => {
    try { localStorage.removeItem("esc_admin_token"); } catch {}
  }, []);

  return null;
}
