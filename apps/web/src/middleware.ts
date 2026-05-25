import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Owner-only: finance module requires owner_session cookie
  if (pathname.startsWith("/admin/finance") && !pathname.startsWith("/admin/finance/login")) {
    const ownerSession = req.cookies.get("owner_session");
    if (!ownerSession || ownerSession.value !== process.env.OWNER_SESSION_TOKEN) {
      const loginUrl = new URL("/admin/finance/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Staff: all other /admin routes require admin_session
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/admin/finance")) {
    const session = req.cookies.get("admin_session");
    if (!session || session.value !== "elite-admin-2024") {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
