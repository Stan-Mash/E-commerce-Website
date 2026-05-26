import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  const auth = session?.value === "elite-admin-2024";

  // Test Supabase connection
  let locationsResult: unknown = null;
  let productsResult: unknown = null;
  let supabaseError: unknown = null;
  try {
    const supabase = createAdminSupabaseClient();
    const { data: locs, error: locErr } = await supabase.from("locations").select("id, name, type").limit(10);
    locationsResult = locErr ? { error: locErr.message } : locs;
    const { data: prods, error: prodErr } = await supabase.from("products").select("id, name").limit(5);
    productsResult = prodErr ? { error: prodErr.message } : prods;
  } catch (e) {
    supabaseError = String(e);
  }

  return NextResponse.json({
    auth: { cookie_exists: !!session, match: auth },
    env: {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING",
      anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "MISSING",
      service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "MISSING",
    },
    locations: locationsResult,
    products: productsResult,
    supabaseError,
  });
}
