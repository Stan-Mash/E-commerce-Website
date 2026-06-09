import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isAuthenticatedOwnerRequest } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
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
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedOwnerRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as {
    category_id:    string;
    description:    string;
    amount:         number;
    expense_date:   string;
    payment_method: string;
    location_id?:   string;
    receipt_url?:   string;
    notes?:         string;
  };

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
}

function incrementMonth(ym: string): string {
  const parts = ym.split("-").map(Number);
  const y = parts[0] ?? 2024;
  const m = parts[1] ?? 1;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return `${next}-01`;
}
