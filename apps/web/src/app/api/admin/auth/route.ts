import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_TOKEN } from "@/lib/adminAuth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// Only allow same-site relative redirect targets. Rejects absolute URLs and
// protocol-relative ("//evil.com") values, which would otherwise be an open
// redirect after login.
function safeRedirectPath(from: string): string {
  return from.startsWith("/") && !from.startsWith("//") ? from : "/admin";
}

// No insecure fallback - if ADMIN_PASSWORD is not configured the admin is
// locked entirely (fail closed). Set ADMIN_PASSWORD in the environment.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/** Constant-time string comparison to avoid timing side-channels. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// The session value is the configured secret token (ADMIN_SESSION_TOKEN),
// never a hardcoded string. encodeURIComponent guards against odd characters.
const SESSION_COOKIE = [
  `admin_session=${encodeURIComponent(ADMIN_SESSION_TOKEN)}`,
  "Path=/",
  "HttpOnly",
  "Secure",
  "SameSite=Lax",
  "Max-Age=28800",
].join("; ");

// Non-secret label cookie used only to attribute admin actions in the audit log.
function operatorCookie(name: string): string {
  return [
    `admin_operator=${encodeURIComponent(name)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=28800",
  ].join("; ");
}

/**
 * JSON endpoint - used by the old fetch-based login (kept for compatibility).
 * Prefer the form-POST flow below which is more reliable with Service Workers.
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  // Brute-force guard: 5 attempts per minute per IP.
  if (!(await rateLimit(`admin-login:${clientIp(req)}`, 5))) {
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      return NextResponse.redirect(new URL("/admin/login?error=rate", req.url), { status: 303 });
    }
    return NextResponse.json({ error: "Too many attempts. Wait a minute and try again." }, { status: 429 });
  }

  // Form submission (native <form> POST)
  // Browser handles the Set-Cookie natively before following the redirect,
  // which is more reliable than relying on the Fetch API.
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await req.formData();
    const password = (formData.get("password") as string | null) ?? "";
    const from     = (formData.get("from")     as string | null) ?? "/admin";
    const operator = ((formData.get("operator") as string | null) ?? "").trim().slice(0, 60);

    if (!ADMIN_PASSWORD || !safeEqual(password, ADMIN_PASSWORD)) {
      const loginUrl = new URL(`/admin/login?error=1&from=${encodeURIComponent(safeRedirectPath(from))}`, req.url);
      return NextResponse.redirect(loginUrl, { status: 303 });
    }

    const dest = new URL(safeRedirectPath(from), req.url);
    const response = NextResponse.redirect(dest, { status: 303 });
    response.headers.append("Set-Cookie", SESSION_COOKIE);
    if (operator) response.headers.append("Set-Cookie", operatorCookie(operator));
    return response;
  }

  // JSON endpoint (fetch-based login)
  const { password } = await req.json() as { password: string };

  if (!ADMIN_PASSWORD || !safeEqual(password ?? "", ADMIN_PASSWORD)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.headers.append("Set-Cookie", SESSION_COOKIE);
  return response;
}
