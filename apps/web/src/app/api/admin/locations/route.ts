import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";

function checkAuth(req: NextRequest): boolean {
  return isAuthenticatedAdminRequest(req);
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
