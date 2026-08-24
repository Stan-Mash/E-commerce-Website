import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const STATUSES = ["requested", "approved", "rejected", "refunded"];
const RESOLUTIONS = ["refund", "store_credit", "exchange"];

const ReturnPatchSchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
  resolution: z.string().nullable().optional(),
  amount: z.coerce.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const GET = withApiErrorHandling("admin/returns GET", async (request: NextRequest) => {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ returns: [] });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("returns")
    .select("*, order:orders(order_ref, phone, total, status)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ returns: data ?? [] });
});

export const PATCH = withApiErrorHandling("admin/returns PATCH", async (request: NextRequest) => {
  if (!isAuthenticatedAdminRequest(request)) {
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
  const parseResult = ReturnPatchSchema.safeParse(jsonBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 422 });
  }
  const body = parseResult.data;

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

  const supabase = createAdminSupabaseClient();
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
});
