import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { recordAudit, getOperator } from "@/lib/audit";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";
import { restoreOrderStock } from "@/lib/orders/restoreStock";

function checkAuth(request: NextRequest): boolean {
  return isAuthenticatedAdminRequest(request);
}

// Orders paid via Buy Goods (Till) that are still awaiting confirmation —
// either from the C2B webhook or a staff member checking manually. Surfaces
// the customer-reported M-Pesa code (if any) so staff have something to act
// on immediately instead of hunting through the general orders list.
export const GET = withApiErrorHandling("admin/orders/pending-buy-goods GET", async (request: NextRequest) => {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ orders: [] });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_ref, phone, email, total, created_at, c2b_payments(expected_amount, phone, mpesa_receipt, customer_reported_code, customer_reported_at, status)")
    .eq("status", "pending_payment")
    .eq("payment_method", "mpesa_c2b")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    order_ref: string;
    phone: string;
    email: string | null;
    total: number;
    created_at: string;
    c2b_payments: Array<{
      expected_amount: number;
      phone: string | null;
      mpesa_receipt: string | null;
      customer_reported_code: string | null;
      customer_reported_at: string | null;
      status: string;
    }> | null;
  };

  const orders = ((data ?? []) as unknown as Row[]).map((o) => {
    const payment = o.c2b_payments?.[0] ?? null;
    return {
      id: o.id,
      orderRef: o.order_ref,
      phone: o.phone,
      email: o.email,
      total: o.total,
      createdAt: o.created_at,
      expectedAmount: payment?.expected_amount ?? o.total,
      mpesaReceipt: payment?.mpesa_receipt ?? null,
      customerReportedCode: payment?.customer_reported_code ?? null,
      customerReportedAt: payment?.customer_reported_at ?? null,
    };
  });

  return NextResponse.json({ orders });
});

const ActionSchema = z.object({
  orderId: z.string().uuid(),
  action: z.enum(["confirm", "reject"]),
});

export const PATCH = withApiErrorHandling("admin/orders/pending-buy-goods PATCH", async (request: NextRequest) => {
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
  const parsed = ActionSchema.safeParse(jsonBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }
  const { orderId, action } = parsed.data;

  const supabase = createAdminSupabaseClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "This order is no longer awaiting payment." }, { status: 409 });
  }

  const { data: payment } = await supabase
    .from("c2b_payments")
    .select("id, expected_amount")
    .eq("order_id", orderId)
    .maybeSingle();

  if (action === "confirm") {
    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", orderId);
    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (payment) {
      await supabase
        .from("c2b_payments")
        .update({ status: "matched", actual_amount: payment.expected_amount })
        .eq("id", payment.id);
    }

    await supabase.from("notification_jobs").insert({
      order_id: orderId,
      job_type: "order_confirmation",
      status: "queued",
    });

    await recordAudit(supabase, {
      actor: getOperator(request),
      action: "order.payment_confirmed",
      entity: "order",
      entityId: orderId,
      detail: { method: "mpesa_c2b" },
    });

    return NextResponse.json({ ok: true });
  }

  // action === "reject"
  const { error: orderError } = await supabase
    .from("orders")
    .update({ status: "payment_failed" })
    .eq("id", orderId);
  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  if (payment) {
    await supabase.from("c2b_payments").update({ status: "expired" }).eq("id", payment.id);
  }

  await restoreOrderStock(supabase, orderId);

  await recordAudit(supabase, {
    actor: getOperator(request),
    action: "order.payment_rejected",
    entity: "order",
    entityId: orderId,
    detail: { method: "mpesa_c2b" },
  });

  return NextResponse.json({ ok: true });
});
