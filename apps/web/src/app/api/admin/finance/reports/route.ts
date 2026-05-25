import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function checkOwner(req: NextRequest) {
  return req.cookies.get("owner_session")?.value === process.env.OWNER_SESSION_TOKEN;
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

/**
 * GET /api/admin/finance/reports?month=YYYY-MM
 *
 * Returns a full monthly P&L breakdown:
 *   Revenue (from paid orders)
 *   – Expenses (by category)
 *   – Loan repayments (that month)
 *   – Tax provisions
 *   = Net position
 */
export async function GET(request: NextRequest) {
  if (!checkOwner(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url   = new URL(request.url);
  const month = url.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const from  = `${month}-01`;
  const to    = nextMonth(month);

  const sb = createAdminSupabaseClient();

  // Revenue: sum of paid orders in period
  const { data: revRows } = await sb
    .from("orders")
    .select("total")
    .eq("status", "paid")
    .gte("created_at", from)
    .lt("created_at", to);

  const revenue = (revRows ?? []).reduce((s, r) => s + (r.total ?? 0), 0);

  // Expenses by category
  const { data: expRows } = await sb
    .from("expenses")
    .select("amount, expense_categories(name)")
    .gte("expense_date", from)
    .lt("expense_date", to);

  const expensesByCategory: Record<string, number> = {};
  let totalExpenses = 0;
  for (const e of expRows ?? []) {
    const cat = (e.expense_categories as { name: string } | null)?.name ?? "Other";
    expensesByCategory[cat] = (expensesByCategory[cat] ?? 0) + e.amount;
    totalExpenses += e.amount;
  }

  // Loan repayments in period
  const { data: payRows } = await sb
    .from("loan_payments")
    .select("amount, loans(lender_name)")
    .gte("payment_date", from)
    .lt("payment_date", to);

  const debtService = (payRows ?? []).reduce((s, p) => s + p.amount, 0);

  // Outstanding loans total
  const { data: loanRows } = await sb
    .from("loans")
    .select("principal_amount, loan_payments(amount)")
    .eq("status", "active");

  const totalOutstanding = (loanRows ?? []).reduce((s, loan) => {
    const paid = ((loan.loan_payments ?? []) as { amount: number }[]).reduce((x, p) => x + p.amount, 0);
    return s + loan.principal_amount - paid;
  }, 0);

  // Tax provisions for month
  const tot        = Math.round(revenue * 0.015);      // 1.5% TOT
  const vatCollected = Math.round(revenue * 0.16 / 1.16); // VAT from VAT-inclusive price

  const grossProfit    = revenue;                       // no COGS tracked yet
  const operatingProfit = grossProfit - totalExpenses;
  const netBeforeDebt  = operatingProfit - debtService;
  const netPosition    = netBeforeDebt - tot;

  return NextResponse.json({
    month,
    revenue,
    gross_profit:      grossProfit,
    expenses_total:    totalExpenses,
    expenses_by_cat:   expensesByCategory,
    debt_service:      debtService,
    total_outstanding: totalOutstanding,
    tax_provisions: {
      tot,
      vat_collected: vatCollected,
    },
    operating_profit:  operatingProfit,
    net_position:      netPosition,
    order_count:       (revRows ?? []).length,
  });
}
