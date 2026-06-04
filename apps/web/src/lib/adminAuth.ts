/**
 * Centralised admin session-token validation.
 *
 * The session token is a SECRET, supplied via the ADMIN_SESSION_TOKEN
 * environment variable. There is intentionally no hardcoded fallback — if the
 * variable is unset, every check below returns false (fail closed), so the
 * admin area is locked rather than accidentally world-open.
 *
 * Set ADMIN_SESSION_TOKEN in your environment (Vercel → Project → Settings →
 * Environment Variables) to a long random string, e.g. the output of
 *   openssl rand -hex 32
 */
export const ADMIN_SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN ?? "";

/** Constant-time comparison to avoid timing side-channels. */
function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** True only when value matches the configured secret token. */
export function isValidAdminToken(value: string | undefined | null): boolean {
  if (!ADMIN_SESSION_TOKEN) return false; // fail closed when unconfigured
  return safeEqual(value ?? "", ADMIN_SESSION_TOKEN);
}

/**
 * Check an incoming request for a valid admin session.
 * Accepted carriers:
 *   1. `admin_session` — HttpOnly, Secure, SameSite=Lax cookie (preferred).
 *   2. `x-admin-token` header — used by the POS terminal's adminFetch() over
 *      a server-to-server channel where cookies are unavailable.
 *
 * The `admin_token` JS-readable cookie is no longer accepted. Keeping a
 * non-HttpOnly admin credential is a stored-XSS risk; all login paths must
 * set the HttpOnly `admin_session` cookie instead.
 */
export function isAuthenticatedAdminRequest(request: {
  cookies: { get(name: string): { value: string } | undefined };
  headers: { get(name: string): string | null };
}): boolean {
  return (
    isValidAdminToken(request.cookies.get("admin_session")?.value) ||
    isValidAdminToken(request.headers.get("x-admin-token"))
  );
}
