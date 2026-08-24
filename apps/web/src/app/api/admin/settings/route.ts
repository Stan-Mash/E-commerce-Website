import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function checkAuth(request: NextRequest): boolean {
  return isAuthenticatedAdminRequest(request);
}

const SettingsSchema = z.record(z.string(), z.string());

const DEFAULTS: Record<string, string> = {
  store_name: "Elite Style Co.",
  store_email: "",
  store_phone: "",
  store_address: "",
  whatsapp_number: "",
  door_delivery_fee: "250",
  free_delivery_threshold: "0",
  delivery_note: "",
  announcement_bar_text: "",
  announcement_bar_enabled: "false",
  low_stock_threshold: "5",
};

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json(DEFAULTS);
  }

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .eq("namespace", "store");

  if (error) {
    // Table doesn't exist or other error - return defaults
    return NextResponse.json(DEFAULTS);
  }

  const result: Record<string, string> = { ...DEFAULTS };
  for (const row of data ?? []) {
    result[row.key] = row.value;
  }

  return NextResponse.json(result);
}

export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parseResult = SettingsSchema.safeParse(jsonBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 422 });
  }
  const body = parseResult.data;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminSupabaseClient();

  const upserts = Object.entries(body).map(([key, value]) => ({
    namespace: "store",
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("app_settings")
    .upsert(upserts, { onConflict: "namespace,key" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
