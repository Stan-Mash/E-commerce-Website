import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  const auth = session?.value === "elite-admin-2024";

  // Raw cookie header for debugging
  const rawCookieHeader = req.headers.get("cookie") ?? "(none)";

  // All cookie names
  const allCookies: Record<string, string> = {};
  req.cookies.getAll().forEach(c => { allCookies[c.name] = c.value; });

  // Test Supabase connection
  let locationsResult: unknown = null;
  let supabaseError: unknown = null;
  try {
    const supabase = createAdminSupabaseClient();
    const { data: locs, error: locErr } = await supabase
      .from("locations")
      .select("id, name, type")
      .limit(10);
    locationsResult = locErr ? { error: locErr.message } : locs;
  } catch (e) {
    supabaseError = String(e);
  }

  return NextResponse.json({
    auth: {
      cookie_exists: !!session,
      cookie_value: session?.value ?? null,
      match: auth,
    },
    raw_cookie_header: rawCookieHeader,
    all_cookies: allCookies,
    env: {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING",
      service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "MISSING",
      admin_password_set: !!process.env.ADMIN_PASSWORD,
      admin_password_value: process.env.ADMIN_PASSWORD ?? "(using fallback elite2024)",
      node_env: process.env.NODE_ENV,
    },
    locations: locationsResult,
    supabaseError,
  });
}
