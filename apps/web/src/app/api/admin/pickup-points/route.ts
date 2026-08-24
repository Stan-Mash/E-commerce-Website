import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { recordAudit, getOperator } from "@/lib/audit";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const MISSING_TABLE = /relation .* does not exist|could not find the table/i;

const PickupPointPostSchema = z.object({
  name: z.string().optional(),
  area: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  fee: z.coerce.number().optional(),
});

const PickupPointPatchSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  area: z.string().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  fee: z.coerce.number().optional(),
  active: z.boolean().optional(),
});

export const GET = withApiErrorHandling("admin/pickup-points GET", async (request: NextRequest) => {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ points: [], migrated: false });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("pickup_points")
    .select("*")
    .order("area")
    .order("name");

  if (error) {
    if (MISSING_TABLE.test(error.message)) {
      return NextResponse.json({ points: [], migrated: false });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ points: data ?? [], migrated: true });
});

export const POST = withApiErrorHandling("admin/pickup-points POST", async (request: NextRequest) => {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parseResult = PickupPointPostSchema.safeParse(jsonBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 422 });
  }
  const body = parseResult.data;
  if (!body.name?.trim() || !body.area?.trim()) {
    return NextResponse.json({ error: "Name and area are required" }, { status: 422 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("pickup_points")
    .insert({
      name: body.name.trim(),
      area: body.area.trim(),
      address: body.address?.trim() || null,
      phone: body.phone?.trim() || null,
      fee: Math.max(0, Math.round(body.fee ?? 0)),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAudit(supabase, {
    actor: getOperator(request),
    action: "pickup_point.create",
    entity: "pickup_point",
    entityId: data.id,
    detail: { name: data.name, area: data.area, fee: data.fee },
  });

  return NextResponse.json({ point: data }, { status: 201 });
});

export const PATCH = withApiErrorHandling("admin/pickup-points PATCH", async (request: NextRequest) => {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parseResult = PickupPointPatchSchema.safeParse(jsonBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 422 });
  }
  const body = parseResult.data;
  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.area !== undefined) patch.area = body.area;
  if (body.address !== undefined) patch.address = body.address;
  if (body.phone !== undefined) patch.phone = body.phone;
  if (body.fee !== undefined) patch.fee = Math.max(0, Math.round(body.fee));
  if (body.active !== undefined) patch.active = body.active;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("pickup_points")
    .update(patch)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAudit(supabase, {
    actor: getOperator(request),
    action: "pickup_point.update",
    entity: "pickup_point",
    entityId: body.id,
    detail: patch,
  });

  return NextResponse.json({ point: data });
});
