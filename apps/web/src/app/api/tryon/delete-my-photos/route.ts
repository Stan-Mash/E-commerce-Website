import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const SESSION_COOKIE = "es_tryon_session";
const BUCKET = "tryon-uploads";

// "Delete my photos now" — immediate purge for the current session, on
// request, rather than waiting for the 24h auto-cleanup cron.
export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: rows } = await supabase
    .from("tryon_uploads")
    .select("id, upload_path")
    .eq("session_id", sessionId);

  if (rows && rows.length > 0) {
    const paths = rows.map((r) => r.upload_path).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
    await supabase.from("tryon_uploads").delete().eq("session_id", sessionId);
  }

  return NextResponse.json({ ok: true, deleted: rows?.length ?? 0 });
}
