import type { MetadataRoute } from "next";
import { createPublicSupabaseClient } from "@/lib/supabase/server";
import { SITE_URL as BASE } from "@/lib/site";

const STATIC_PATHS = [
  "", "/products", "/woman", "/man", "/children", "/coming-soon",
  "/search", "/journal", "/atelier", "/sizing-guide", "/returns",
  "/legal", "/contact", "/track", "/wishlist",
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.6,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = createPublicSupabaseClient();
      const { data } = await supabase
        .from("products")
        .select("slug")
        .in("status", ["active", "coming_soon"]);
      productEntries = (data ?? []).map((p: { slug: string }) => ({
        url: `${BASE}/products/${p.slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    } catch {
      // Supabase unavailable at build — ship the static sitemap.
    }
  }

  return [...staticEntries, ...productEntries];
}
