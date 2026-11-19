import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/product/ProductBreadcrumb";
import { createPublicSupabaseClient } from "@/lib/supabase/server";
import { ThriftFilteredGrid } from "@/components/es/ThriftFilteredGrid";

export const metadata: Metadata = {
  title: "Thrift Store Nairobi | Pre-Owned Fashion | Elite Style Co.",
  description:
    "Shop pre-owned & second-hand fashion in Nairobi. Women's, men's & children's thrift pieces from KES 400. M-Pesa checkout, 24-hour delivery. Nairobi CBD.",
  alternates: { canonical: "/thrifted" },
};

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


async function getThriftedProducts(): Promise<ProductRow[]> {
  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        `id, name, slug, base_price, compare_price, category,
         product_images(url, alt, sort_order),
         skus(size, stock_quantity)`
      )
      .eq("status", "active")
      .in("category", [
        "thrift-women", "thrift-men", "thrift-children",
        "thrift-plus-women", "thrift-plus-men",
        "thrift-standard", "thrift-plus", "thrifted", "Thrifted", "THRIFTED",
      ])
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as unknown as ProductRow[];
  } catch {
    return [];
  }
}

export const revalidate = 60;

export default async function ThriftedPage() {
  const products = await getThriftedProducts();

  return (
    <div className="min-h-screen bg-es-paper">
      {/* Editorial hero */}
      <div className="relative w-full overflow-hidden" style={{ height: "60vh" }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #2c2416 0%, #4a3820 40%, #6b4f2e 70%, #8a6840 100%)",
          }}
        />
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p
            className="mb-4 text-[11px] tracking-[.48em] uppercase"
            style={{ color: "#c9a961" }}
          >
            ELITE STYLE CO.
          </p>
          <h1
            className="mb-4 text-5xl sm:text-7xl font-bold leading-none text-white"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            Thrifted
          </h1>
          <p className="mb-8 text-sm text-white/60 max-w-sm leading-relaxed">
            Pre-owned pieces, curated for a second life. Quality you can trust,
            prices that make sense.
          </p>
          {/* Two entry paths */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/thrifted/plus-size"
              className="px-7 py-3 text-[10px] tracking-[.38em] uppercase font-medium no-underline transition-colors"
              style={{ background: "#c9a961", color: "#1a1209" }}
            >
              Plus Size
            </Link>
            <Link
              href="/thrifted/standard"
              className="px-7 py-3 text-[10px] tracking-[.38em] uppercase font-medium no-underline transition-colors border"
              style={{ borderColor: "rgba(201,169,97,.5)", color: "#c9a961" }}
            >
              Standard
            </Link>
            <Link
              href="#products"
              className="px-7 py-3 bg-white/10 border border-white/30 text-white text-[11px] tracking-[.38em] uppercase hover:bg-white/20 transition-colors"
            >
              View All
            </Link>
          </div>
        </div>
      </div>

      {/* Product section */}
      <div
        id="products"
        className="mx-auto w-full max-w-[1200px] px-6 py-10 sm:px-16 sm:py-20"
      >
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Thrifted" }]}
        />
        <header className="mt-6 mb-10">
          <p className="mb-3 text-[11px] tracking-[.48em] uppercase text-es-champagne-dk">
            PRE-OWNED
          </p>
          <h2
            className="text-4xl sm:text-5xl font-bold leading-none tracking-tight text-es-ink"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            THE THRIFTED EDIT
          </h2>
        </header>

        <ThriftFilteredGrid
          products={products}
          emptyMessage="New thrifted pieces landing soon."
          browseHref="/products"
        />
      </div>
    </div>
  );
}
