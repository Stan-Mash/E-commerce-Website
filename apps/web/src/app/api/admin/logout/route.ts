import { NextRequest, NextResponse } from "next/server";

// POST only — GET would be prefetched by Next.js <Link> and silently clear cookies.
export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login", req.url));
  res.cookies.set("admin_session", "", { maxAge: 0, path: "/" });
  // Also expire the old admin_token cookie so any browsers that still hold
  // one from before this hardening change are cleanly signed out.
  res.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
  return res;
}
