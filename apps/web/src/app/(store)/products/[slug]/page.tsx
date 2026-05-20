import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductBreadcrumb } from "@/components/product/ProductBreadcrumb";
import type { ProductDetail } from "@nairobi-fashion/lib";

interface Props {
  params: { slug: string };
}

// ── Static seed fallback (used when Supabase is not configured) ──────────────
const SEED_PRODUCTS: ProductDetail[] = [
  { id:"1", name:"Kikoy Wrap Dress", slug:"kikoy-wrap-dress", description:"Vibrant stripe-print wrap dress in lightweight cotton — easy to wear, easy to style. A versatile piece that takes you from day to evening.", base_price:8500, compare_price:11000, category:"Woman", material:"100% Cotton", care_instructions:"Hand wash cold. Lay flat to dry.", is_featured:true, status:"active", created_at:"", updated_at:"", product_images:[], skus:[{id:"s1",size:"S",color:null,color_hex:null,stock_quantity:4,sku_code:"KWD-S",product_id:"1",created_at:"",updated_at:""},{id:"s2",size:"M",color:null,color_hex:null,stock_quantity:6,sku_code:"KWD-M",product_id:"1",created_at:"",updated_at:""},{id:"s3",size:"L",color:null,color_hex:null,stock_quantity:3,sku_code:"KWD-L",product_id:"1",created_at:"",updated_at:""}], product_videos:[] },
  { id:"2", name:"Bead Collar Shirt", slug:"maasai-bead-collar-shirt", description:"Clean Oxford cotton shirt with an intricately beaded collar detail. A sharp, conversation-starting piece for any occasion.", base_price:6200, compare_price:null, category:"Man", material:"100% Oxford Cotton", care_instructions:"Machine wash cold. Do not tumble dry.", is_featured:false, status:"active", created_at:"", updated_at:"", product_images:[], skus:[{id:"s4",size:"S",color:null,color_hex:null,stock_quantity:2,sku_code:"MBS-S",product_id:"2",created_at:"",updated_at:""},{id:"s5",size:"M",color:null,color_hex:null,stock_quantity:5,sku_code:"MBS-M",product_id:"2",created_at:"",updated_at:""},{id:"s6",size:"L",color:null,color_hex:null,stock_quantity:4,sku_code:"MBS-L",product_id:"2",created_at:"",updated_at:""}], product_videos:[] },
  { id:"3", name:"Ankara Print Jumpsuit", slug:"ankara-print-kids-jumpsuit", description:"Bold wax-print cotton jumpsuit with snap-leg fastening for easy dressing. Bright, comfortable, and built to keep up with your child.", base_price:4800, compare_price:null, category:"Children", material:"100% Wax-Print Cotton", care_instructions:"Machine wash warm.", is_featured:false, status:"active", created_at:"", updated_at:"", product_images:[], skus:[{id:"s7",size:"2Y",color:null,color_hex:null,stock_quantity:8,sku_code:"APJ-2Y",product_id:"3",created_at:"",updated_at:""},{id:"s8",size:"4Y",color:null,color_hex:null,stock_quantity:6,sku_code:"APJ-4Y",product_id:"3",created_at:"",updated_at:""},{id:"s9",size:"6Y",color:null,color_hex:null,stock_quantity:4,sku_code:"APJ-6Y",product_id:"3",created_at:"",updated_at:""}], product_videos:[] },
  { id:"4", name:"Nairobi Linen Co-ord", slug:"nairobi-linen-co-ord", description:"Relaxed linen two-piece in a clean tailored cut. Wear together or as separates. The kind of outfit that looks better the more you wear it.", base_price:12400, compare_price:null, category:"Woman", material:"100% Linen", care_instructions:"Hand wash or dry clean.", is_featured:true, status:"active", created_at:"", updated_at:"", product_images:[], skus:[{id:"s10",size:"S",color:null,color_hex:null,stock_quantity:3,sku_code:"NLC-S",product_id:"4",created_at:"",updated_at:""},{id:"s11",size:"M",color:null,color_hex:null,stock_quantity:4,sku_code:"NLC-M",product_id:"4",created_at:"",updated_at:""}], product_videos:[] },
  { id:"5", name:"Wax Print Relaxed Shirt", slug:"kitenge-baraza-shirt", description:"Relaxed open-hem shirt in a bold wax-cotton print. Easy-going and stylish — perfect for weekends, evenings, and everything in between.", base_price:5800, compare_price:null, category:"Man", material:"100% Wax-Print Cotton", care_instructions:"Hand wash cold.", is_featured:false, status:"active", created_at:"", updated_at:"", product_images:[], skus:[{id:"s13",size:"M",color:null,color_hex:null,stock_quantity:5,sku_code:"KBS-M",product_id:"5",created_at:"",updated_at:""},{id:"s14",size:"L",color:null,color_hex:null,stock_quantity:4,sku_code:"KBS-L",product_id:"5",created_at:"",updated_at:""}], product_videos:[] },
  { id:"6", name:"Check Print Romper", slug:"shuka-check-romper", description:"Stretch cotton romper in a bold check print. Comfortable, easy to move in, and effortlessly stylish for little ones.", base_price:3200, compare_price:null, category:"Children", material:"95% Cotton, 5% Elastane", care_instructions:"Machine wash warm.", is_featured:false, status:"active", created_at:"", updated_at:"", product_images:[], skus:[{id:"s16",size:"2Y",color:null,color_hex:null,stock_quantity:6,sku_code:"SCR-2Y",product_id:"6",created_at:"",updated_at:""},{id:"s17",size:"4Y",color:null,color_hex:null,stock_quantity:5,sku_code:"SCR-4Y",product_id:"6",created_at:"",updated_at:""}], product_videos:[] },
];

async function getProduct(slug: string): Promise<ProductDetail | null> {
  // Try Supabase if configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createServerSupabaseClient } = await import("@/lib/supabase/server");
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
      if (!error && data) return data as unknown as ProductDetail;
    } catch {
      // Fall through to seed data
    }
  }
  // Static seed fallback
  return SEED_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product Not Found" };

  const primaryImage = product.product_images
    ?.sort((a, b) => a.sort_order - b.sort_order)
    .find((i) => i.media_type === "image");

  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? null,
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
