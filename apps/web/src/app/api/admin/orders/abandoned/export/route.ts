import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const ACTIVE_AGE_FLOOR_MS = 15 * 60 * 1000;
const EXPIRED_WINDOW_MS = 48 * 60 * 60 * 1000;

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const GET = withApiErrorHandling("admin/orders/abandoned/export GET", async (request: NextRequest) => {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const view = request.nextUrl.searchParams.get("view") === "expired" ? "expired" : "active";
  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from("orders")
    .select(`
      id, order_ref, created_at, phone, email, total, delivery_type, status,
      customers(name, phone, email),
      order_items(quantity, skus(size, color, products(name))),
      promotions(code)
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  query =
    view === "active"
      ? query.eq("status", "pending_payment").lte("created_at", new Date(Date.now() - ACTIVE_AGE_FLOOR_MS).toISOString())
      : query.eq("status", "payment_failed").gte("created_at", new Date(Date.now() - EXPIRED_WINDOW_MS).toISOString());

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = ["Order Ref", "Date", "Customer Name", "Phone", "Email", "Items", "Delivery", "Total", "Promo Code", "Status"];

  const rows = (data ?? []).map((o) => {
    const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
    const items = (o.order_items ?? [])
      .map((i) => {
        const sku = Array.isArray(i.skus) ? i.skus[0] : i.skus;
        const product = sku ? (Array.isArray(sku.products) ? sku.products[0] : sku.products) : null;
        return product ? `${product.name}${sku?.size ? ` (${sku.size})` : ""} x${i.quantity}` : `x${i.quantity}`;
      })
      .join("; ");
    const promo = Array.isArray(o.promotions) ? o.promotions[0] : o.promotions;

    return [
      escapeCsvField(o.order_ref),
      escapeCsvField(new Date(o.created_at as string).toLocaleString("en-KE")),
      escapeCsvField(customer?.name ?? ""),
      escapeCsvField(o.phone ?? customer?.phone ?? ""),
      escapeCsvField(o.email ?? customer?.email ?? ""),
      escapeCsvField(items),
      escapeCsvField(o.delivery_type ?? ""),
      escapeCsvField(Number(o.total)),
      escapeCsvField(promo?.code ?? ""),
      escapeCsvField(o.status),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `abandoned-checkouts-${view}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
