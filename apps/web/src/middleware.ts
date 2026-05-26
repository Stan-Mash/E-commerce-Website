import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Forward the pathname as a header so Server Component layouts can read it.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  // Owner-only: finance module requires owner_session cookie
  if (pathname.startsWith("/admin/finance") && !pathname.startsWith("/admin/finance/login")) {
    const ownerSession = req.cookies.get("owner_session");
    if (!ownerSession || ownerSession.value !== process.env.OWNER_SESSION_TOKEN) {
      const loginUrl = new URL("/admin/finance/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Staff: all other /admin routes require admin_session OR admin_token
  // admin_session is the HttpOnly cookie set by the server.
  // admin_token is a non-HttpOnly fallback set via document.cookie on login.
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/admin/finance")) {
    const session = req.cookies.get("admin_session");
    const token   = req.cookies.get("admin_token");
    const valid = session?.value === "elite-admin-2024" || token?.value === "elite-admin-2024";
    if (!valid) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*"],
};
