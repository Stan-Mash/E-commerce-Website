"use client";

import { useEffect } from "react";

/**
 * Clears any stale esc_admin_token from localStorage on mount.
 *
 * The old flow read the non-HttpOnly admin_token cookie into localStorage
 * so that adminFetch() could pass it as an x-admin-token header.  That
 * cookie is no longer issued — all admin API calls now rely on the HttpOnly
 * admin_session cookie via credentials:"include".  This component's only
 * job now is to scrub the stale localStorage value on existing browsers.
 */
export default function AdminSessionSync() {
  useEffect(() => {
    try { localStorage.removeItem("esc_admin_token"); } catch {}
  }, []);

  return null;
}
