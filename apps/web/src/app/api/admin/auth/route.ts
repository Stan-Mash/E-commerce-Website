import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "elite2024";

const COOKIE_HEADER = [
  "admin_session=elite-admin-2024",
  "Path=/",
  "HttpOnly",
  "Secure",
  "SameSite=Lax",
  "Max-Age=28800",
].join("; ");

/**
 * JSON endpoint — used by the old fetch-based login (kept for compatibility).
 * Prefer the form-POST flow below which is more reliable with Service Workers.
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  // ── Form submission (native <form> POST) ─────────────────────────────────
  // Browser handles the Set-Cookie natively before following the redirect,
  // which is more reliable than relying on the Fetch API.
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await req.formData();
    const password = (formData.get("password") as string | null) ?? "";
    const from     = (formData.get("from")     as string | null) ?? "/admin";

    if (password !== ADMIN_PASSWORD) {
      const loginUrl = new URL(`/admin/login?error=1&from=${encodeURIComponent(from)}`, req.url);
      return NextResponse.redirect(loginUrl, { status: 303 });
    }

    const dest = new URL(from.startsWith("/") ? from : "/admin", req.url);
    const response = NextResponse.redirect(dest, { status: 303 });
    response.headers.set("Set-Cookie", COOKIE_HEADER);
    return response;
  }

  // ── JSON endpoint (fetch-based login) ────────────────────────────────────
  const { password } = await req.json() as { password: string };

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", COOKIE_HEADER);
  return response;
}
