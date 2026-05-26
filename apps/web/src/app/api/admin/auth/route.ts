import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "elite2024";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const maxAge = 60 * 60 * 8; // 8 hours
  const cookieHeader = [
    "admin_session=elite-admin-2024",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ].join("; ");

  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", cookieHeader);
  return response;
}
