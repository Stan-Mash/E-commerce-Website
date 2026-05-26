import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "elite2024";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Set cookie via next/headers (more reliable in App Router than NextResponse.cookies)
  cookies().set("admin_session", "elite-admin-2024", {
    httpOnly: true,
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
    sameSite: "lax",
  });

  return NextResponse.json({ ok: true });
}
