import type { Metadata } from "next";
import Link from "next/link";
import { createPublicSupabaseClient } from "@/lib/supabase/server";
import { ThriftFilteredGrid } from "@/components/es/ThriftFilteredGrid";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const products = await getProducts();
  return {
    title: "Standard Size Thrift | Pre-Owned Fashion Nairobi (XS–XL)",
    description: "Shop pre-owned standard size fashion in Nairobi. Women's, men's & children's thrift pieces from XS to XL. KES pricing, M-Pesa checkout.",
    alternates: { canonical: "/thrifted/standard" },
    ...(products.length === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  compare_price: number | null;
  category: string;
  product_images: { url: string; alt: string | null; sort_order: number }[];
  skus: { size: string; stock_quantity: number }[];
}

const STANDARD_CATEGORIES = [
  "thrift-women", "thrift-men", "thrift-children",
  "thrift-standard",
  // Catch-all: items tagged "thrifted" without a gender sub-category
  "thrifted", "Thrifted", "THRIFTED",
];

async function getProducts(): Promise<ProductRow[]> {
  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(`id, name, slug, base_price, compare_price, category, product_images(url, alt, sort_order), skus(size, stock_quantity)`)
      .in("category", STANDARD_CATEGORIES)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data as unknown as ProductRow[];
  } catch {
    return [];
  }
}

export default async function ThriftStandardPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-es-paper">
      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ height: "56vh" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #2c2416 0%, #4a3820 40%, #6b4f2e 70%, #8a6840 100%)" }} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <nav className="flex items-center gap-2 mb-6 text-[9px] tracking-[.4em] uppercase" style={{ color: "rgba(201,169,97,.6)" }}>
            <Link href="/" className="no-underline" style={{ color: "rgba(201,169,97,.6)" }}>Home</Link>
            <span>/</span>
            <Link href="/thrifted" className="no-underline" style={{ color: "rgba(201,169,97,.6)" }}>Thrift Store</Link>
            <span>/</span>
            <span style={{ color: "#c9a961" }}>Standard</span>
          </nav>

          <div className="inline-block font-sans text-[8px] tracking-[.5em] uppercase font-medium px-3 py-1.5 mb-5" style={{ color: "#c9a961", border: "1px solid rgba(201,169,97,.35)" }}>
            Pre-Owned · XS – XL · Women · Men · Children
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold leading-none text-white mb-4" style={{ fontFamily: "var(--font-bodoni)" }}>
            Standard<br />Thrift
          </h1>
          <p className="text-sm leading-relaxed max-w-sm mb-8" style={{ color: "rgba(255,255,255,0.65)" }}>
            Quality pre-owned pieces in standard sizes for women, men and children.
          </p>

          <div className="flex gap-3">
            <Link href="/thrifted/plus-size" className="font-sans text-[10px] tracking-[.35em] uppercase font-medium px-5 py-2.5 no-underline border" style={{ borderColor: "rgba(201,169,97,.4)", color: "rgba(201,169,97,.7)" }}>
              Plus Size
            </Link>
            <span className="font-sans text-[10px] tracking-[.35em] uppercase font-medium px-5 py-2.5" style={{ background: "#c9a961", color: "#1a1209" }}>
              Standard
            </span>
          </div>
        </div>
      </div>

      {/* Products with gender filter */}
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10 sm:px-16 sm:py-20">
        <ThriftFilteredGrid
          products={products}
          emptyMessage="Standard pieces landing soon."
          browseHref="/thrifted"
        />
      </div>
    </div>
  );
}
