import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { FeedProduct } from "@/lib/feeds";

export const FEED_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://e-commerce-website-web.vercel.app";
export const STORE_NAME = "Elite Style Co.";

// Active catalogue rows shaped for the feed builders.
export async function fetchFeedProducts(): Promise<FeedProduct[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, description, base_price, category, product_images(url, sort_order, media_type), skus(stock_quantity)")
    .eq("status", "active");

  if (error || !data) return [];

  type Row = {
    id: string; name: string; slug: string; description: string | null;
    base_price: number; category: string;
    product_images: Array<{ url: string; sort_order: number; media_type: string | null }> | null;
    skus: Array<{ stock_quantity: number }> | null;
  };

  return (data as unknown as Row[]).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    base_price: Number(p.base_price),
    category: p.category,
    imageUrls: (p.product_images ?? [])
      .filter((i) => i.media_type !== "video")
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => i.url),
    inStock: (p.skus ?? []).reduce((s, k) => s + k.stock_quantity, 0) > 0,
  }));
}
