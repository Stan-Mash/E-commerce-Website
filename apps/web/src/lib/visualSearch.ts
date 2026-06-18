import type { SupabaseClient } from "@supabase/supabase-js";
import { embedImages, isVisualSearchConfigured, toVectorLiteral } from "@/lib/embeddings";

// Embed up to `batch` product images that don't have an embedding yet.
// Best-effort: skips images that fail, returns counts for reporting.
export async function sweepImageEmbeddings(
  supabase: SupabaseClient,
  batch = 20
): Promise<{ embedded: number; remaining: number; skipped: number; reason?: string; firstError?: string; firstUrl?: string }> {
  if (!isVisualSearchConfigured()) {
    return { embedded: 0, remaining: 0, skipped: 0, reason: "JINA_API_KEY not set" };
  }

  const { data: pending, error } = await supabase
    .from("product_images")
    .select("id, url")
    .is("embedding", null)
    .eq("media_type", "image")
    .limit(batch);

  if (error) {
    // Column missing means migration 016 isn't applied yet.
    return { embedded: 0, remaining: 0, skipped: 0, reason: error.message };
  }
  if (!pending || pending.length === 0) {
    return { embedded: 0, remaining: 0, skipped: 0 };
  }

  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

  let embedded = 0;
  let skipped = 0;
  let firstError: string | undefined;
  let firstUrl: string | undefined;
  for (const img of pending) {
    // Jina requires absolute URLs; relative paths are stored for local assets.
    const imageUrl = img.url.startsWith("http") ? img.url : `${siteBase}${img.url}`;
    if (!firstUrl) firstUrl = imageUrl;
    try {
      const [vector] = await embedImages([imageUrl]);
      if (!vector) { skipped++; continue; }
      const { error: upErr } = await supabase
        .from("product_images")
        .update({ embedding: toVectorLiteral(vector) })
        .eq("id", img.id);
      if (upErr) { skipped++; if (!firstError) firstError = upErr.message; }
      else embedded++;
    } catch (e) {
      const msg = (e as Error).message;
      console.warn(`[visual-search] embed failed for image ${img.id}:`, msg);
      if (!firstError) firstError = msg;
      skipped++;
    }
  }

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .is("embedding", null)
    .eq("media_type", "image");

  return {
    embedded,
    skipped,
    remaining: count ?? 0,
    ...(firstError !== undefined ? { firstError } : {}),
    ...(firstUrl  !== undefined ? { firstUrl  } : {}),
  };
}
