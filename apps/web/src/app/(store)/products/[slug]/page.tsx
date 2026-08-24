import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductBreadcrumb } from "@/components/product/ProductBreadcrumb";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ProductReviews } from "@/components/product/ProductReviews";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { isTryOnConfigured } from "@/lib/tryon/provider";
import type { ProductDetail } from "@nairobi-fashion/lib";
import { absoluteUrl, jsonLdString } from "@/lib/site";

const PRODUCT_QUERY_TIMEOUT_MS = 8_000;

interface Props {
  params: Promise<{ slug: string }>;
}

async function getReviewSummary(productId: string): Promise<{ count: number; average: number }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { count: 0, average: 0 };
  try {
    const { createPublicSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from("product_reviews")
      .select("rating")
      .eq("product_id", productId)
      .eq("is_approved", true);
    const ratings = data ?? [];
    const count = ratings.length;
    const average = count > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / count : 0;
    return { count, average: Math.round(average * 10) / 10 };
  } catch {
    return { count: 0, average: 0 };
  }
}

async function getProduct(slug: string): Promise<ProductDetail | null> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createPublicSupabaseClient } = await import("@/lib/supabase/server");
      const supabase = createPublicSupabaseClient();

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PRODUCT_QUERY_TIMEOUT_MS);

      const { data, error } = await supabase
        .from("products")
        .select(
          `id, name, slug, description, base_price, compare_price, category,
           material, care_instructions, is_featured, status,
           product_images(id, url, alt, cloudinary_public_id, media_type, sort_order),
           skus(id, size, color, color_hex, stock_quantity, sku_code),
           product_videos(id, cloudinary_url, cloudinary_public_id, thumbnail_url, duration_seconds, sort_order)`
        )
        .eq("slug", slug)
        .in("status", ["active", "coming_soon"])
        .abortSignal(controller.signal)
        .maybeSingle();

      clearTimeout(timer);

      if (error) {
        console.error("[product-page] Supabase error for slug:", slug, error.message);
        // Fall through to seed data
      } else if (data) {
        return data as unknown as ProductDetail;
      }
    } catch (err) {
      console.error("[product-page] Query failed for slug:", slug, (err as Error).message);
    }
  }
  return null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product Not Found" };

  const primaryImage = product.product_images
    ?.sort((a, b) => a.sort_order - b.sort_order)
    .find((i) => i.media_type === "image");

  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? null,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) ?? "",
      images: primaryImage ? [{ url: primaryImage.url }] : [],
      type: "website",
    },
  };
}

export const revalidate = 60; // ISR: revalidate product pages every 60s

export default async function ProductPage(props: Props) {
  const params = await props.params;
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const reviewSummary = await getReviewSummary(product.id);
  const productUrl = absoluteUrl(`/products/${product.slug}`);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.product_images
      ?.sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => i.url),
    brand: { "@type": "Brand", name: "Elite Style Co." },
    ...(reviewSummary.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewSummary.average,
            reviewCount: reviewSummary.count,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "KES",
      price: product.base_price,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.skus?.some((s) => s.stock_quantity > 0)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(structuredData) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ProductBreadcrumb category={product.category} productName={product.name} />
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <ProductGallery
            images={product.product_images ?? []}
            videos={product.product_videos ?? []}
            productName={product.name}
          />
          <ProductInfo product={product} tryOnEnabled={isTryOnConfigured()} />
        </div>
        {product.status !== "coming_soon" && (
          <Suspense fallback={null}>
            <ProductReviews productId={product.id} />
          </Suspense>
        )}
        <Suspense fallback={null}>
          <RelatedProducts
            category={product.category}
            currentProductId={product.id}
          />
        </Suspense>
      </div>
      <RecentlyViewed excludeProductId={product.id} />
    </>
  );
}
