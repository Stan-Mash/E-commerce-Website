import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";

// Temporary, read-only: verifies the phone-fallback C2B matching fix wrote
// the customer's phone onto pending c2b_payments rows as expected. Delete
// once confirmed.
export async function GET(req: NextRequest) {
  if (!isAuthenticatedAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("c2b_payments")
    .select("id, order_id, order_ref, expected_amount, phone, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}
