import type { SupabaseClient } from "@supabase/supabase-js";

// Replaces a product's image rows with the given ordered URL list.
// sort_order = array index, so the first URL is the primary image.
export async function syncProductImages(
  supabase: SupabaseClient,
  productId: string,
  urls: string[],
  alt: string | null
): Promise<void> {
  await supabase.from("product_images").delete().eq("product_id", productId);

  const clean = urls.filter((u) => typeof u === "string" && u.trim().length > 0);
  if (clean.length === 0) return;

  await supabase.from("product_images").insert(
    clean.map((url, i) => ({
      product_id: productId,
      url,
      alt,
      media_type: "image",
      sort_order: i,
    }))
  );
}

// Replaces a product's videos with the given ordered URL list. The storefront
// gallery plays product_videos.cloudinary_url; cloudinary_public_id is NOT NULL,
// so we store the same URL there (these are Supabase Storage objects, not Cloudinary).
export async function syncProductVideos(
  supabase: SupabaseClient,
  productId: string,
  urls: string[]
): Promise<void> {
  await supabase.from("product_videos").delete().eq("product_id", productId);

  const clean = urls.filter((u) => typeof u === "string" && u.trim().length > 0);
  if (clean.length === 0) return;

  await supabase.from("product_videos").insert(
    clean.map((url, i) => ({
      product_id: productId,
      cloudinary_url: url,
      cloudinary_public_id: url,
      sort_order: i,
    }))
  );
}

export function resolveVideoList(body: { videos?: unknown }): string[] | undefined {
  if (Array.isArray(body.videos)) {
    return body.videos.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
  }
  return undefined;
}

// Normalises the image payload from a form. Accepts the new `images` array and
// falls back to a single `image_url` for backward compatibility.
export function resolveImageList(body: { images?: unknown; image_url?: unknown }): string[] | undefined {
  if (Array.isArray(body.images)) {
    return body.images.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
  }
  if (typeof body.image_url === "string" && body.image_url.trim().length > 0) {
    return [body.image_url];
  }
  if (body.image_url === null || body.image_url === "") {
    return [];
  }
  return undefined; // image fields absent — leave images untouched
}
