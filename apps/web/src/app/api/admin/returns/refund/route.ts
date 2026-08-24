import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { isB2CConfigured, initiateB2CPayment } from "@/lib/mpesa/daraja";
import { recordAudit, getOperator } from "@/lib/audit";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const RefundSchema = z.object({
  returnId: z.string(),
});

// POST /api/admin/returns/refund { returnId }
// Sends the return's refund amount to the customer's phone via M-Pesa B2C.
export async function POST(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isB2CConfigured()) {
    return NextResponse.json(
      { error: "M-Pesa refunds aren't set up. Configure the Daraja B2C env vars (initiator, security credential, B2C shortcode), then mark the refund manually for now." },
      { status: 503 }
    );
  }

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = RefundSchema.safeParse(jsonBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }
  const { returnId } = parsed.data;
  if (!returnId) {
    return NextResponse.json({ error: "Missing returnId" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: ret } = await supabase
    .from("returns")
    .select("id, amount, status, order:orders(order_ref, phone, total)")
    .eq("id", returnId)
    .single();

  if (!ret) {
    return NextResponse.json({ error: "Return not found" }, { status: 404 });
  }
  if (ret.status === "refunded") {
    return NextResponse.json({ error: "This return is already refunded." }, { status: 409 });
  }

  const order = (Array.isArray(ret.order) ? ret.order[0] : ret.order) as
    | { order_ref: string; phone: string; total: number }
    | null;
  if (!order?.phone) {
    return NextResponse.json({ error: "Order phone missing." }, { status: 422 });
  }

  const amount = Math.round(ret.amount ?? order.total ?? 0);
  if (amount <= 0) {
    return NextResponse.json({ error: "Set a refund amount first." }, { status: 422 });
  }

  try {
    const result = await initiateB2CPayment({
      phone: order.phone,
      amount,
      remarks: `Refund for ${order.order_ref}`,
      occasion: "return",
    });

    if (result.ResponseCode !== "0") {
      return NextResponse.json({ error: result.ResponseDescription || "Refund was rejected by M-Pesa." }, { status: 502 });
    }

    await supabase
      .from("returns")
      .update({ status: "refunded", resolution: "refund", amount, updated_at: new Date().toISOString() })
      .eq("id", returnId);

    await recordAudit(supabase, {
      actor: getOperator(request),
      action: "return.refund",
      entity: "return",
      entityId: returnId,
      detail: { amount, order_ref: order.order_ref, conversation_id: result.ConversationID },
    });

    return NextResponse.json({ ok: true, amount, message: "Refund sent to the customer's M-Pesa." });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
