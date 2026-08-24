import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function checkAuth(request: NextRequest): boolean {
  return isAuthenticatedAdminRequest(request);
}

export const GET = withApiErrorHandling("admin/customers GET", async (request: NextRequest) => {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ customers: [] });
  }

  const supabase = createAdminSupabaseClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select(`
      id,
      phone,
      name,
      email,
      created_at,
      orders(id, total, created_at, status)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute order count and total spend per customer
  const enriched = (customers ?? []).map((c) => {
    const orders = (c.orders as Array<{ id: string; total: number; created_at: string; status: string }>) ?? [];
    const paidOrders = orders.filter((o) =>
      ["paid", "processing", "ready_for_pickup", "shipped", "delivered"].includes(o.status)
    );
    const total_spent = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const last_order = orders.length > 0
      ? orders.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.created_at ?? null
      : null;

    return {
      id: c.id,
      phone: c.phone,
      name: c.name,
      email: c.email,
      created_at: c.created_at,
      order_count: orders.length,
      total_spent,
      last_order_at: last_order,
    };
  });

  return NextResponse.json({ customers: enriched });
});
