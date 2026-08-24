import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function checkAuth(request: NextRequest): boolean {
  return isAuthenticatedAdminRequest(request);
}

export const GET = withApiErrorHandling("admin/orders GET", async (request: NextRequest) => {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ orders: [] });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      customers(id, phone, name),
      order_items(
        id,
        quantity,
        unit_price,
        subtotal,
        skus(
          id,
          sku_code,
          size,
          color,
          products(id, name)
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
});
