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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      customers(id, phone, name, email),
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
          products(id, name, base_price)
        )
      ),
      mpesa_transactions(id, mpesa_receipt_number, amount_paid, status, transaction_date)
    `)
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ order: data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.json() as {
    status?: string;
    tracking_number?: string | null;
    courier?: string | null;
    tracking_url?: string | null;
  };

  // Only set fields that were sent (tracking columns come from migration 014).
  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) patch.status = body.status;
  if (body.tracking_number !== undefined) patch.tracking_number = body.tracking_number || null;
  if (body.courier !== undefined) patch.courier = body.courier || null;
  if (body.tracking_url !== undefined) patch.tracking_url = body.tracking_url || null;
  if (body.tracking_number) patch.shipped_at = new Date().toISOString();

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify the customer (WhatsApp/SMS/email via the cron worker) when a
  // tracking number is first added.
  if (body.tracking_number) {
    await supabase.from("notification_jobs").insert({
      order_id: params.id,
      job_type: "order_shipped",
      status: "queued",
    });
  }

  return NextResponse.json({ order: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.json();
  const { status } = body;

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ order: data });
}
