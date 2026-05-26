import { NextRequest, NextResponse } from "next/server";

// Temporary debug endpoint — remove after auth investigation
export async function GET(req: NextRequest) {
  const cookieObj: Record<string, string> = {};
  req.cookies.getAll().forEach(({ name, value }) => {
    cookieObj[name] = value;
  });

  return NextResponse.json({
    cookies: cookieObj,
    cookieHeader: req.headers.get("cookie"),
    xAdminToken: req.headers.get("x-admin-token"),
    xPathname: req.headers.get("x-pathname"),
    origin: req.headers.get("origin"),
    referer: req.headers.get("referer"),
  });
}
