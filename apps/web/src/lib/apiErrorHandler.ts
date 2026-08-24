import { NextResponse } from "next/server";

// Wraps an API route handler so an unhandled throw returns a clean JSON 500
// instead of Next's generic HTML error page. Admin routes historically had no
// try/catch at all, so a malformed request body or an unexpected null could
// crash the handler with an opaque response instead of a usable error.
export function withApiErrorHandling<Args extends unknown[]>(
  routeName: string,
  handler: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error(`[${routeName}] Unhandled error:`, err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
