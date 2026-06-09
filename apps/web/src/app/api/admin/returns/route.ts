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

const STATUSES = ["requested", "approved", "rejected", "refunded"];
const RESOLUTIONS = ["refund", "store_credit", "exchange"];

export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ returns: [] });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("returns")
    .select("*, order:orders(order_ref, phone, total, status)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ returns: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.json() as {
    id?: string;
    status?: string;
    resolution?: string | null;
    amount?: number | null;
    notes?: string | null;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Missing return id" }, { status: 400 });
  }
  if (body.status && !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 422 });
  }
  if (body.resolution && !RESOLUTIONS.includes(body.resolution)) {
    return NextResponse.json({ error: "Invalid resolution" }, { status: 422 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) patch.status = body.status;
  if (body.resolution !== undefined) patch.resolution = body.resolution;
  if (body.amount !== undefined) patch.amount = body.amount;
  if (body.notes !== undefined) patch.notes = body.notes;

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("returns")
    .update(patch)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ return: data });
}
