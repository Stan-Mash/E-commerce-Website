import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isAuthenticatedOwnerRequest } from "@/lib/adminAuth";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";

const ExpenseSchema = z.object({
  category_id: z.string(),
  description: z.string(),
  amount: z.coerce.number(),
  expense_date: z.string(),
  payment_method: z.string(),
  location_id: z.string().optional(),
  receipt_url: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = withApiErrorHandling("admin/finance/expenses GET", async (request: NextRequest) => {
  if (!isAuthenticatedOwnerRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = createAdminSupabaseClient();
  const url = new URL(request.url);
  const month = url.searchParams.get("month"); // YYYY-MM

  let query = sb.from("expenses")
    .select("*, expense_categories(name, icon)")
    .order("expense_date", { ascending: false });

  if (month) {
    query = query
      .gte("expense_date", `${month}-01`)
      .lt("expense_date", incrementMonth(month));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expenses: data });
});

export const POST = withApiErrorHandling("admin/finance/expenses POST", async (request: NextRequest) => {
  if (!isAuthenticatedOwnerRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parseResult = ExpenseSchema.safeParse(jsonBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 422 });
  }
  const body = parseResult.data;

  const sb = createAdminSupabaseClient();
  const { data, error } = await sb.from("expenses").insert({
    category_id:    body.category_id,
    description:    body.description,
    amount:         Math.round(body.amount),
    expense_date:   body.expense_date,
    payment_method: body.payment_method,
    location_id:    body.location_id ?? null,
    receipt_url:    body.receipt_url ?? null,
    notes:          body.notes ?? null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data }, { status: 201 });
});

function incrementMonth(ym: string): string {
  const parts = ym.split("-").map(Number);
  const y = parts[0] ?? 2024;
  const m = parts[1] ?? 1;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return `${next}-01`;
}
