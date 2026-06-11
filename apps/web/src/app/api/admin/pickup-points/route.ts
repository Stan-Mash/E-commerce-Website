import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { recordAudit, getOperator } from "@/lib/audit";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const MISSING_TABLE = /relation .* does not exist|could not find the table/i;

export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ points: [], migrated: false });
  }

  const supabase = getAdminClient();
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
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    name?: string; area?: string; address?: string; phone?: string; fee?: number;
  };
  if (!body.name?.trim() || !body.area?.trim()) {
    return NextResponse.json({ error: "Name and area are required" }, { status: 422 });
  }

  const supabase = getAdminClient();
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
}

export async function PATCH(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    id?: string; name?: string; area?: string; address?: string | null;
    phone?: string | null; fee?: number; active?: boolean;
  };
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

  const supabase = getAdminClient();
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
}
