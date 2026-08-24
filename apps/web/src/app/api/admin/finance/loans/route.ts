import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isAuthenticatedOwnerRequest } from "@/lib/adminAuth";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";

const LoanBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add_loan"),
    lender_name: z.string().optional(),
    loan_type: z.string().optional(),
    principal_amount: z.coerce.number().optional(),
    interest_rate: z.coerce.number().optional(),
    start_date: z.string().optional(),
    due_date: z.string().optional(),
    notes: z.string().optional(),
  }),
  z.object({
    action: z.literal("add_payment"),
    loan_id: z.string().optional(),
    amount: z.coerce.number().optional(),
    payment_date: z.string().optional(),
    payment_notes: z.string().optional(),
  }),
]);

export const GET = withApiErrorHandling("admin/finance/loans GET", async (request: NextRequest) => {
  if (!isAuthenticatedOwnerRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = createAdminSupabaseClient();
  const { data: loans, error } = await sb
    .from("loans")
    .select("*, loan_payments(id, amount, payment_date, notes)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Compute outstanding balance for each loan
  const enriched = (loans ?? []).map(loan => {
    const paid = (loan.loan_payments ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0);
    return { ...loan, amount_paid: paid, outstanding: loan.principal_amount - paid };
  });

  return NextResponse.json({ loans: enriched });
});

export const POST = withApiErrorHandling("admin/finance/loans POST", async (request: NextRequest) => {
  if (!isAuthenticatedOwnerRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = createAdminSupabaseClient();
  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parseResult = LoanBodySchema.safeParse(jsonBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 422 });
  }
  const body = parseResult.data;

  if (body.action === "add_loan") {
    const { data, error } = await sb.from("loans").insert({
      lender_name:      body.lender_name,
      loan_type:        body.loan_type,
      principal_amount: Math.round(body.principal_amount ?? 0),
      interest_rate:    body.interest_rate ?? 0,
      start_date:       body.start_date,
      due_date:         body.due_date ?? null,
      notes:            body.notes ?? null,
      status:           "active",
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ loan: data }, { status: 201 });
  }

  if (body.action === "add_payment") {
    const { data, error } = await sb.from("loan_payments").insert({
      loan_id:      body.loan_id,
      amount:       Math.round(body.amount ?? 0),
      payment_date: body.payment_date,
      notes:        body.payment_notes ?? null,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ payment: data }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
});
