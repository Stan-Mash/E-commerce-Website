import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_TOKEN } from "@/lib/adminAuth";

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

/**
 * JSON endpoint - used by the old fetch-based login (kept for compatibility).
 * Prefer the form-POST flow below which is more reliable with Service Workers.
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

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

    if (!ADMIN_PASSWORD || !safeEqual(password, ADMIN_PASSWORD)) {
      const loginUrl = new URL(`/admin/login?error=1&from=${encodeURIComponent(from)}`, req.url);
      return NextResponse.redirect(loginUrl, { status: 303 });
    }

    const dest = new URL(from.startsWith("/") ? from : "/admin", req.url);
    const response = NextResponse.redirect(dest, { status: 303 });
    response.headers.append("Set-Cookie", SESSION_COOKIE);
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
