import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login", req.url));
  res.cookies.set("admin_session", "", { maxAge: 0, path: "/" });
  res.cookies.set("admin_token",   "", { maxAge: 0, path: "/" });
  return res;
}
