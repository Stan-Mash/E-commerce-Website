import { NextRequest, NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

// GET /api/products/by-ids?ids=a,b,c — public product cards for the wishlist.
export async function GET(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ products: [] });
  }

  const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100);
  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, base_price, compare_price, category, status, product_images(url, sort_order)")
    .in("id", ids)
    .in("status", ["active", "coming_soon"]);

  if (error) {
    return NextResponse.json({ products: [] });
  }
  return NextResponse.json({ products: data ?? [] });
}
