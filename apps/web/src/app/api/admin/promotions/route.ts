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

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ promotions: [] });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ promotions: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const body = await request.json() as {
    name?: string;
    code?: string;
    type?: string;
    value?: number;
    min_spend?: number | null;
    max_uses?: number | null;
    active?: boolean;
    starts_at?: string | null;
    expires_at?: string | null;
  };

  const { name, code, type, value, min_spend, max_uses, active, starts_at, expires_at } = body;

  if (!name || !type || value === undefined) {
    return NextResponse.json({ error: "name, type, and value are required" }, { status: 400 });
  }

  if (!["percentage", "fixed_amount", "free_shipping"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("promotions")
    .insert({
      name,
      code:       code?.trim().toUpperCase() || null,
      type,
      value:      Number(value),
      min_spend:  min_spend ? Number(min_spend) : null,
      max_uses:   max_uses  ? Number(max_uses)  : null,
      active:     active ?? true,
      starts_at:  starts_at  || null,
      expires_at: expires_at || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ promotion: data }, { status: 201 });
}
