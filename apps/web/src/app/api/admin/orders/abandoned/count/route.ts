import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";

const ACTIVE_AGE_FLOOR_MS = 15 * 60 * 1000;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Cheap count-only endpoint for the AdminNav badge — deliberately separate
// from GET /api/admin/orders/abandoned so the nav (rendered on every admin
// page) doesn't pull the full row set with item/customer joins just to show
// a number.
export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ count: 0 });
  }

  const supabase = getAdminClient();
  const cutoff = new Date(Date.now() - ACTIVE_AGE_FLOOR_MS).toISOString();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_payment")
    .lte("created_at", cutoff);

  return NextResponse.json({ count: count ?? 0 });
}
