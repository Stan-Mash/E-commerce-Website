"use client";

import { useEffect } from "react";

/**
 * Syncs the admin_token cookie to localStorage on every admin page mount.
 * The POS terminal uses localStorage.getItem("esc_admin_token") for its
 * adminFetch() helper, so we need to keep it in sync with the cookie session.
 */
export default function AdminSessionSync() {
  useEffect(() => {
    // admin_token is a non-HttpOnly cookie readable from JS.
    // If it's present, mirror it to localStorage for the POS adminFetch() helper.
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith("admin_token="));
    if (match) {
      const value = match.split("=")[1] ?? "";
      if (value) {
        try { localStorage.setItem("esc_admin_token", value); } catch {}
      }
    }
  }, []);

  return null;
}
