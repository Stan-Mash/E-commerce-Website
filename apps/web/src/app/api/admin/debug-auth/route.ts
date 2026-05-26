import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  return NextResponse.json({
    cookie_exists: !!session,
    cookie_value: session?.value ?? null,
    expected: "elite-admin-2024",
    match: session?.value === "elite-admin-2024",
    all_cookies: Object.fromEntries(
      [...req.cookies.getAll()].map(c => [c.name, c.value])
    ),
  });
}
