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

function checkAuth(request: NextRequest): boolean {
  return isAuthenticatedAdminRequest(request);
}

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam   = searchParams.get("from");
  const toParam     = searchParams.get("to");
  const statusParam = searchParams.get("status");

  const supabase = getAdminClient();

  let query = supabase
    .from("orders")
    .select(`
      id,
      order_ref,
      created_at,
      phone,
      status,
      subtotal,
      delivery_fee,
      total,
      delivery_type,
      customers(name, phone),
      order_items(id),
      mpesa_transactions(mpesa_receipt_number, status)
    `)
    .order("created_at", { ascending: false });

  if (statusParam) {
    query = query.eq("status", statusParam);
  }

  if (fromParam) {
    query = query.gte("created_at", `${fromParam}T00:00:00.000Z`);
  }

  if (toParam) {
    query = query.lte("created_at", `${toParam}T23:59:59.999Z`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = data ?? [];

  // Build CSV
  const headers = [
    "Order Ref",
    "Date",
    "Phone",
    "Customer Name",
    "Items Count",
    "Subtotal",
    "Delivery Fee",
    "Total",
    "Status",
    "Payment Method",
  ];

  const rows = orders.map((order) => {
    const customer = Array.isArray(order.customers)
      ? order.customers[0]
      : order.customers;

    const customerName = customer?.name ?? "";
    const phone = order.phone ?? customer?.phone ?? "";

    const mpesa = Array.isArray(order.mpesa_transactions)
      ? order.mpesa_transactions[0]
      : order.mpesa_transactions;

    const paymentMethod =
      mpesa?.mpesa_receipt_number
        ? `M-Pesa (${mpesa.mpesa_receipt_number})`
        : mpesa
        ? "M-Pesa"
        : "Unknown";

    const itemsCount = Array.isArray(order.order_items)
      ? order.order_items.length
      : 0;

    const date = new Date(order.created_at as string).toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return [
      escapeCsvField(order.order_ref),
      escapeCsvField(date),
      escapeCsvField(phone),
      escapeCsvField(customerName),
      escapeCsvField(itemsCount),
      escapeCsvField(Number(order.subtotal)),
      escapeCsvField(Number(order.delivery_fee)),
      escapeCsvField(Number(order.total)),
      escapeCsvField(order.status),
      escapeCsvField(paymentMethod),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  const today = new Date().toISOString().slice(0, 10);
  const filename = `orders-${today}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
