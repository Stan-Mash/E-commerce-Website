// Admin and owner session-token validation. Tokens come from env vars; when a
// token is unset every check fails closed so the area is locked, not open.

export const ADMIN_SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN ?? "";
export const OWNER_SESSION_TOKEN = process.env.OWNER_SESSION_TOKEN ?? "";

// Constant-time comparison to avoid timing side-channels.
export function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function isValidAdminToken(value: string | undefined | null): boolean {
  if (!ADMIN_SESSION_TOKEN) return false;
  return safeEqual(value ?? "", ADMIN_SESSION_TOKEN);
}

export function isValidOwnerToken(value: string | undefined | null): boolean {
  if (!OWNER_SESSION_TOKEN) return false;
  return safeEqual(value ?? "", OWNER_SESSION_TOKEN);
}

type RequestLike = {
  cookies: { get(name: string): { value: string } | undefined };
  headers: { get(name: string): string | null };
};

// Accepts the HttpOnly admin_session cookie, or the x-admin-token header used
// by the POS terminal's server-to-server calls.
export function isAuthenticatedAdminRequest(request: RequestLike): boolean {
  return (
    isValidAdminToken(request.cookies.get("admin_session")?.value) ||
    isValidAdminToken(request.headers.get("x-admin-token"))
  );
}

export function isAuthenticatedOwnerRequest(request: {
  cookies: { get(name: string): { value: string } | undefined };
}): boolean {
  return isValidOwnerToken(request.cookies.get("owner_session")?.value);
}
