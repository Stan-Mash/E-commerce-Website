import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { safeEqual } from "@/lib/adminAuth";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";

const OwnerLoginSchema = z.object({
  password: z.string(),
});

/**
 * Owner login - issues owner_session cookie.
 * Uses OWNER_PASSWORD env var (never exposed to staff).
 * The cookie value is OWNER_SESSION_TOKEN env var - a separate secret
 * so the password itself never travels in a cookie.
 */
export const POST = withApiErrorHandling("admin/owner/login POST", async (request: NextRequest) => {
  // Brute-force guard: 5 attempts per minute per IP.
  if (!(await rateLimit(`owner-login:${clientIp(request)}`, 5))) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute and try again." }, { status: 429 });
  }

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = OwnerLoginSchema.safeParse(jsonBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }
  const { password } = parsed.data;
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
});

export const DELETE = withApiErrorHandling("admin/owner/login DELETE", async () => {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("owner_session", "", { maxAge: 0, path: "/" });
  return res;
});
