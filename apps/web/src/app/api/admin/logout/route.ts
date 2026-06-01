import { NextRequest, NextResponse } from "next/server";

// POST only — GET would be prefetched by Next.js <Link> and silently clear cookies.
export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login", req.url));
  res.cookies.set("admin_session", "", { maxAge: 0, path: "/" });
  res.cookies.set("admin_token",   "", { maxAge: 0, path: "/" });
  return res;
}
