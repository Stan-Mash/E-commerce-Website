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
};

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json(DEFAULTS);
  }

  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .eq("namespace", "store");

  if (error) {
    // Table doesn't exist or other error — return defaults
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

  let body: Record<string, string>;
  try {
    body = (await request.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true });
  }

  const supabase = getAdminClient();

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
