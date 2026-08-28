import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

// Cheap count-only endpoint for the AdminNav badge — deliberately separate
// from GET /api/admin/orders/pending-buy-goods so the nav (rendered on every
// admin page) doesn't pull the full row set with the c2b_payments join just
// to show a number.
export const GET = withApiErrorHandling("admin/orders/pending-buy-goods/count GET", async (request: NextRequest) => {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ count: 0 });
  }

  const supabase = createAdminSupabaseClient();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_payment")
    .eq("payment_method", "mpesa_c2b");

  return NextResponse.json({ count: count ?? 0 });
});
