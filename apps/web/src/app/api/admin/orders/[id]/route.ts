import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { recordAudit, getOperator } from "@/lib/audit";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function checkAuth(request: NextRequest): boolean {
  return isAuthenticatedAdminRequest(request);
}

const ALLOWED_STATUSES = [
  "pending_payment", "paid", "payment_failed", "processing",
  "ready_for_pickup", "shipped", "delivered", "cancelled", "refunded",
] as const;

const ALLOWED_COURIERS = ["DHL", "G4S", "Sendy", "Fargo", "Wells Fargo", "Direct", "Other"] as const;

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const OrderPutSchema = z.object({
  status: z.string().optional(),
  tracking_number: z.string().nullable().optional(),
  courier: z.string().nullable().optional(),
  tracking_url: z.string().nullable().optional(),
});

const OrderPatchSchema = z.object({
  status: z.string(),
});

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = createAdminSupabaseClient();
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

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parseResult = OrderPutSchema.safeParse(jsonBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 422 });
  }
  const body = parseResult.data;

  // Only set fields that were sent (tracking columns come from migration 014).
  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status as (typeof ALLOWED_STATUSES)[number])) {
      return NextResponse.json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}` }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (body.tracking_number !== undefined) patch.tracking_number = body.tracking_number || null;
  if (body.courier !== undefined) patch.courier = body.courier || null;
  if (body.tracking_url !== undefined) {
    if (body.tracking_url && !isValidHttpUrl(body.tracking_url)) {
      return NextResponse.json({ error: "Invalid tracking URL — must start with http:// or https://" }, { status: 400 });
    }
    patch.tracking_url = body.tracking_url || null;
  }
  if (body.tracking_number) patch.shipped_at = new Date().toISOString();

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
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

  await recordAudit(supabase, {
    actor: getOperator(request),
    action: "order.fulfilment",
    entity: "order",
    entityId: params.id,
    detail: patch,
  });

  return NextResponse.json({ order: data });
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parseResult = OrderPatchSchema.safeParse(jsonBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 422 });
  }
  const { status } = parseResult.data;

  if (!status || !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    return NextResponse.json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}` }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAudit(supabase, {
    actor: getOperator(request),
    action: "order.status",
    entity: "order",
    entityId: params.id,
    detail: { status },
  });

  return NextResponse.json({ order: data });
}
