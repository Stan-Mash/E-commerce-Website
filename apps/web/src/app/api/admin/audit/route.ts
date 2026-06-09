import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const MISSING_TABLE = /relation .* does not exist|could not find the table/i;

export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ entries: [], migrated: false });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    if (MISSING_TABLE.test(error.message)) {
      return NextResponse.json({ entries: [], migrated: false });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [], migrated: true });
}
