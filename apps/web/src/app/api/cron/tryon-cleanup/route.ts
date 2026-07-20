import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

const BUCKET = "tryon-uploads";

function isAuthorised(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return auth === `Bearer ${secret}`;
}

// Runs daily (see vercel.json) — deletes try-on uploads/results past their
// 24h expiry, both the Storage objects and the tracking rows. Kenya Data
// Protection Act compliance: photos of people must not outlive their stated
// retention window. (Vercel Hobby plans cap crons at once/day — if this
// project is on Hobby, a daily sweep is what's available; the 24h expiry on
// each row is still enforced by delete-my-photos and by simply not serving
// an expired result_path.)
export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true, deleted: 0, note: "Supabase not configured" });
  }

  const supabase = createAdminSupabaseClient();
  const { data: expired } = await supabase
    .from("tryon_uploads")
    .select("id, upload_path")
    .lt("expires_at", new Date().toISOString())
    .limit(500);

  if (!expired || expired.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  const paths = expired.map((r) => r.upload_path).filter(Boolean);
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }
  await supabase
    .from("tryon_uploads")
    .delete()
    .in("id", expired.map((r) => r.id));

  return NextResponse.json({ ok: true, deleted: expired.length });
}
