import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { embedImages, isVisualSearchConfigured, toVectorLiteral } from "@/lib/embeddings";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const maxDuration = 30;

// POST /api/search/visual { imageBase64 } — SHEIN-style search-by-photo.
// The client compresses the photo to ~512px JPEG before upload.
export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Search is not available yet." }, { status: 503 });
  }
  if (!isVisualSearchConfigured()) {
    return NextResponse.json(
      { error: "Visual search isn't enabled yet. Set JINA_API_KEY to activate it." },
      { status: 503 }
    );
  }
  if (!(await rateLimit(`visual:${clientIp(req)}`, 10))) {
    return NextResponse.json({ error: "Too many searches. Please wait a moment." }, { status: 429 });
  }

  let body: { imageBase64?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const b64 = (body.imageBase64 ?? "").replace(/^data:image\/\w+;base64,/, "").trim();
  // ~4 MB base64 ceiling; client compresses well below this.
  if (!b64 || b64.length > 4_000_000) {
    return NextResponse.json({ error: "Please upload a smaller photo." }, { status: 422 });
  }

  try {
    const [queryVector] = await embedImages([b64]);
    if (!queryVector) {
      return NextResponse.json({ error: "Could not read that photo. Try another." }, { status: 422 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: matches, error } = await supabase.rpc("match_products_by_embedding", {
      p_embedding: toVectorLiteral(queryVector),
      p_count: 24,
    });

    if (error) {
      console.error("[visual-search] match RPC error:", error.message);
      return NextResponse.json({ error: "Visual search isn't ready — apply migration 016." }, { status: 503 });
    }

    const rows = (matches ?? []) as Array<{ product_id: string; distance: number }>;
    if (rows.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const ids = rows.map((r) => r.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug, base_price, compare_price, category, status, product_images(url, alt, sort_order), skus(size, stock_quantity)")
      .in("id", ids);

    // Preserve similarity order and attach the distance score.
    const byId = new Map((products ?? []).map((p: { id: string }) => [p.id, p]));
    const results = rows
      .map((r) => {
        const p = byId.get(r.product_id);
        return p ? { ...p, similarity: Math.max(0, 1 - r.distance) } : null;
      })
      .filter(Boolean);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[visual-search] error:", (err as Error).message);
    return NextResponse.json({ error: "Visual search failed. Please try again." }, { status: 502 });
  }
}
