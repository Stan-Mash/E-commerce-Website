import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getTryOnProvider, isTryOnConfigured } from "@/lib/tryon/provider";

const SESSION_COOKIE = "es_tryon_session";

export async function GET(req: NextRequest) {
  if (!isTryOnConfigured()) {
    return NextResponse.json({ ok: false, error: "Try-on is temporarily unavailable." }, { status: 503 });
  }

  const id = req.nextUrl.searchParams.get("id");
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  if (!id || !sessionId) {
    return NextResponse.json({ ok: false, error: "Missing session." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: row } = await supabase
    .from("tryon_uploads")
    .select("id, session_id, status, provider_job_id, result_path")
    .eq("id", id)
    .maybeSingle();

  if (!row || row.session_id !== sessionId) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  if (row.status !== "pending") {
    return NextResponse.json({ ok: true, status: row.status, resultUrl: row.result_path ?? undefined });
  }

  const provider = getTryOnProvider();
  const result = await provider.checkStatus(row.provider_job_id!);
  if (!result.ok) {
    return NextResponse.json({ ok: true, status: "pending" }); // transient provider error — client keeps polling
  }
  if (result.status === "pending") {
    return NextResponse.json({ ok: true, status: "pending" });
  }

  await supabase
    .from("tryon_uploads")
    .update({ status: result.status, result_path: result.status === "completed" ? result.resultUrl : null })
    .eq("id", id);

  return NextResponse.json({ ok: true, status: result.status, resultUrl: result.status === "completed" ? result.resultUrl : undefined });
}
