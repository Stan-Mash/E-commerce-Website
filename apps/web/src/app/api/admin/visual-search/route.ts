import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isAuthenticatedAdminRequest } from "@/lib/adminAuth";
import { isVisualSearchConfigured } from "@/lib/embeddings";
import { sweepImageEmbeddings } from "@/lib/visualSearch";

export const maxDuration = 60;

// GET — status: how many images are embedded vs pending.
export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ configured: false, embedded: 0, pending: 0 });
  }

  const supabase = createAdminSupabaseClient();
  const { count: embedded, error } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .not("embedding", "is", null);
  const { count: pending } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .is("embedding", null)
    .eq("media_type", "image")
    .not("url", "ilike", "%.avif");

  return NextResponse.json({
    configured: isVisualSearchConfigured(),
    migrated: !error,
    embedded: embedded ?? 0,
    pending: pending ?? 0,
  });
}

// POST — run one backfill sweep (embeds up to 20 images per call).
export async function POST(request: NextRequest) {
  if (!isAuthenticatedAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = createAdminSupabaseClient();
  const result = await sweepImageEmbeddings(supabase, 20);
  return NextResponse.json(result);
}
