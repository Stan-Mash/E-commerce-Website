import { NextRequest, NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 0; // always fresh

// Public product search: Postgres full-text (search_vector) with an ilike
// fallback. Returns only status='active' products.
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const supabase = createPublicSupabaseClient();

    const select = `id, name, slug, base_price, compare_price, category,
       product_images(url, alt, sort_order),
       skus(size, stock_quantity)`;

    // Primary: full-text search on the generated tsvector.
    // websearch_to_tsquery handles natural phrasing ("blue knitted vest").
    let { data, error } = await supabase
      .from("products")
      .select(select)
      .eq("status", "active")
      .textSearch("search_vector", q, { type: "websearch", config: "english" })
      .limit(48);

    // Fallback: if FTS errors or returns nothing, do a fuzzy name/category match.
    if (error || !data || data.length === 0) {
      const like = `%${q}%`;
      const res = await supabase
        .from("products")
        .select(select)
        .eq("status", "active")
        .or(`name.ilike.${like},category.ilike.${like},description.ilike.${like}`)
        .limit(48);
      data = res.data ?? [];
    }

    return NextResponse.json({ results: data ?? [] });
  } catch {
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
