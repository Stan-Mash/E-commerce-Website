import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { withApiErrorHandling } from "@/lib/apiErrorHandler";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function checkAuth(request: NextRequest): boolean {
  return isAuthenticatedAdminRequest(request);
}

const PromotionSchema = z.object({
  name: z.string().optional(),
  code: z.string().nullable().optional(),
  type: z.string().optional(),
  value: z.coerce.number().optional(),
  min_spend: z.coerce.number().nullable().optional(),
  max_uses: z.coerce.number().nullable().optional(),
  active: z.boolean().optional(),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
});

export const GET = withApiErrorHandling("admin/promotions GET", async (request: NextRequest) => {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ promotions: [] });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ promotions: data ?? [] });
});

export const POST = withApiErrorHandling("admin/promotions POST", async (request: NextRequest) => {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parseResult = PromotionSchema.safeParse(jsonBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 422 });
  }
  const body = parseResult.data;

  const { name, code, type, value, min_spend, max_uses, active, starts_at, expires_at } = body;

  if (!name || !type || value === undefined) {
    return NextResponse.json({ error: "name, type, and value are required" }, { status: 400 });
  }

  if (!["percentage", "fixed_amount", "free_shipping"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
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
});
