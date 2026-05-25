import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function checkOwner(req: NextRequest) {
  return req.cookies.get("owner_session")?.value === process.env.OWNER_SESSION_TOKEN;
}

export async function GET(request: NextRequest) {
  if (!checkOwner(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
}

export async function POST(request: NextRequest) {
  if (!checkOwner(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = createAdminSupabaseClient();
  const body = await request.json() as {
    action: "add_loan" | "add_payment";
    // add_loan fields
    lender_name?:      string;
    loan_type?:        string;
    principal_amount?: number;
    interest_rate?:    number;
    start_date?:       string;
    due_date?:         string;
    notes?:            string;
    // add_payment fields
    loan_id?:          string;
    amount?:           number;
    payment_date?:     string;
    payment_notes?:    string;
  };

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
}
