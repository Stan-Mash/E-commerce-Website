import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const ACTIVE_AGE_FLOOR_MS = 15 * 60 * 1000; // 15 minutes
const EXPIRED_WINDOW_MS = 48 * 60 * 60 * 1000; // 48h — matches the cron's own cart-reminder window
const ROW_LIMIT = 200;

const ORDER_SELECT = `
  id, order_ref, status, subtotal, delivery_fee, total, delivery_type,
  phone, email, discount_amount, promotion_id, created_at,
  customers(id, name, phone, email),
  order_items(id, quantity, unit_price, skus(size, color, products(name))),
  promotions(code, type, value)
`;

export const GET = withApiErrorHandling("admin/orders/abandoned GET", async (request: NextRequest) => {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ orders: [], activeCount: 0, expiredCount: 0 });
  }

  const view = request.nextUrl.searchParams.get("view") === "expired" ? "expired" : "active";
  const supabase = createAdminSupabaseClient();

  const activeCutoff = new Date(Date.now() - ACTIVE_AGE_FLOOR_MS).toISOString();
  const expiredSince = new Date(Date.now() - EXPIRED_WINDOW_MS).toISOString();

  let query = supabase.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(ROW_LIMIT);
  query =
    view === "active"
      ? query.eq("status", "pending_payment").lte("created_at", activeCutoff)
      : query.eq("status", "payment_failed").gte("created_at", expiredSince);

  const [{ data: orders, error }, activeCountRes, expiredCountRes] = await Promise.all([
    query,
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending_payment").lte("created_at", activeCutoff),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "payment_failed").gte("created_at", expiredSince),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orderIds = (orders ?? []).map((o) => o.id);
  let contactByOrderId: Record<string, { at: string; by: string }> = {};

  if (orderIds.length > 0) {
    const { data: contacts } = await supabase
      .from("admin_audit_log")
      .select("entity_id, actor, created_at")
      .eq("entity", "order")
      .eq("action", "order.recovery_contact")
      .in("entity_id", orderIds)
      .order("created_at", { ascending: false });

    // Rows come back newest-first; keep only the first (most recent) per order.
    contactByOrderId = (contacts ?? []).reduce((acc, c) => {
      if (!acc[c.entity_id as string]) acc[c.entity_id as string] = { at: c.created_at as string, by: c.actor as string };
      return acc;
    }, {} as Record<string, { at: string; by: string }>);
  }

  const enriched = (orders ?? []).map((o) => ({ ...o, lastContact: contactByOrderId[o.id] ?? null }));

  return NextResponse.json({
    orders: enriched,
    activeCount: activeCountRes.count ?? 0,
    expiredCount: expiredCountRes.count ?? 0,
  });
});
