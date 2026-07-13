import { NextRequest, NextResponse } from "next/server";
import { safeEqual } from "@/lib/adminAuth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

/**
 * Owner login - issues owner_session cookie.
 * Uses OWNER_PASSWORD env var (never exposed to staff).
 * The cookie value is OWNER_SESSION_TOKEN env var - a separate secret
 * so the password itself never travels in a cookie.
 */
export async function POST(request: NextRequest) {
  // Brute-force guard: 5 attempts per minute per IP.
  if (!(await rateLimit(`owner-login:${clientIp(request)}`, 5))) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute and try again." }, { status: 429 });
  }

  const { password } = await request.json() as { password: string };
  const ownerPassword = process.env.OWNER_PASSWORD ?? "";

  if (!password || !ownerPassword || !safeEqual(password, ownerPassword)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = process.env.OWNER_SESSION_TOKEN;
  if (!token) {
    console.error("[owner/login] OWNER_SESSION_TOKEN env var not set");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("owner_session", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 8, // 8 hours
    path:     "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("owner_session", "", { maxAge: 0, path: "/" });
  return res;
}
