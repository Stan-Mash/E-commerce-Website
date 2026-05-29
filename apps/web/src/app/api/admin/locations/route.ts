import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function checkAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session")?.value === "elite-admin-2024";
  const token   = req.cookies.get("admin_token")?.value   === "elite-admin-2024";
  const header  = req.headers.get("x-admin-token")        === "elite-admin-2024";
  return session || token || header;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("locations")
    .select("id, name, type, address, is_active")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ locations: data });
}
