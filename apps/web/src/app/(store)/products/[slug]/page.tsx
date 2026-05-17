import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductBreadcrumb } from "@/components/product/ProductBreadcrumb";
import type { ProductDetail } from "@nairobi-fashion/lib";

interface Props {
  params: { slug: string };
}

async function getProduct(slug: string): Promise<ProductDetail | null> {
  const supabase = createServerSupabaseClient();
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
    .eq("status", "active")
    .single();

  if (error || !data) return null;
  return data as unknown as ProductDetail;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product Not Found" };

  const primaryImage = product.product_images
    ?.sort((a, b) => a.sort_order - b.sort_order)
    .find((i) => i.media_type === "image");

  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) ?? "",
      images: primaryImage ? [{ url: primaryImage.url }] : [],
      type: "website",
    },
  };
}

export const revalidate = 60; // ISR: revalidate product pages every 60s

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.product_images
      ?.sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: product.base_price,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ProductBreadcrumb category={product.category} productName={product.name} />
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <ProductGallery
            images={product.product_images ?? []}
            videos={product.product_videos ?? []}
            productName={product.name}
          />
          <ProductInfo product={product} />
        </div>
      </div>
    </>
  );
}
