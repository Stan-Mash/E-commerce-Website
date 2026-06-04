import { NextRequest, NextResponse } from "next/server";
import { isValidAdminToken } from "@/lib/adminAuth";

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

  // Staff: all other /admin routes require the HttpOnly admin_session cookie.
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/admin/finance")) {
    const valid = isValidAdminToken(req.cookies.get("admin_session")?.value);
    if (!valid) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
