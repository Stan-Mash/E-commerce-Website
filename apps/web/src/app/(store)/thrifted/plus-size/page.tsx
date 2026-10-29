import type { Metadata } from "next";
import Link from "next/link";
import { formatKES } from "@/lib/utils";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Plus Size Thrift",
  description: "Pre-owned plus size fashion (size 16+) at great prices. Quality thrifted pieces for curvy figures.",
  alternates: { canonical: "/thrifted/plus-size" },
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

const GRADIENTS = [
  "from-[#e8e4dc] to-[#b5a08030]",
  "from-[#ddd8cc] to-[#a08b6030]",
  "from-[#e0d8cc] to-[#c4a87030]",
  "from-[#d8d0c4] to-[#b09a7030]",
  "from-[#e4dcd4] to-[#c8a88030]",
  "from-[#dcd4c8] to-[#b89a6830]",
];

async function getProducts(): Promise<ProductRow[]> {
  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(`id, name, slug, base_price, compare_price, category, product_images(url, alt, sort_order), skus(size, stock_quantity)`)
      .eq("category", "thrift-plus")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data as unknown as ProductRow[];
  } catch {
    return [];
  }
}

export default async function ThriftPlusSizePage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-es-paper">
      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ height: "56vh" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #2c2416 0%, #4a3820 40%, #6b4f2e 70%, #8a6840 100%)" }} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6 text-[9px] tracking-[.4em] uppercase" style={{ color: "rgba(201,169,97,.6)" }}>
            <Link href="/" className="no-underline" style={{ color: "rgba(201,169,97,.6)" }}>Home</Link>
            <span>/</span>
            <Link href="/thrifted" className="no-underline" style={{ color: "rgba(201,169,97,.6)" }}>Thrift Store</Link>
            <span>/</span>
            <span style={{ color: "#c9a961" }}>Plus Size</span>
          </nav>

          <div className="inline-block font-sans text-[8px] tracking-[.5em] uppercase font-medium px-3 py-1.5 mb-5" style={{ color: "#c9a961", border: "1px solid rgba(201,169,97,.35)" }}>
            Pre-Owned · Size 16+
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold leading-none text-white mb-4" style={{ fontFamily: "var(--font-bodoni)" }}>
            Plus Size<br />Thrift
          </h1>
          <p className="text-sm leading-relaxed max-w-sm mb-8" style={{ color: "rgba(255,255,255,0.65)" }}>
            Quality pre-owned pieces for curvy figures, size 16 and above.
          </p>

          {/* Toggle between sub-sections */}
          <div className="flex gap-3">
            <span className="font-sans text-[10px] tracking-[.35em] uppercase font-medium px-5 py-2.5" style={{ background: "#c9a961", color: "#1a1209" }}>
              Plus Size
            </span>
            <Link href="/thrifted/standard" className="font-sans text-[10px] tracking-[.35em] uppercase font-medium px-5 py-2.5 no-underline border" style={{ borderColor: "rgba(201,169,97,.4)", color: "rgba(201,169,97,.7)" }}>
              Standard
            </Link>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10 sm:px-16 sm:py-20">
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-es-mute text-sm tracking-[.25em] uppercase mb-4">Plus size pieces landing soon.</p>
            <Link href="/thrifted" className="inline-block px-8 py-3 bg-es-ink text-white text-[11px] tracking-[.35em] uppercase hover:opacity-80 transition-opacity">
              Browse All Thrift
            </Link>
          </div>
        ) : (
          <>
            <p className="font-sans text-[12px] text-es-mute mb-8">{products.length} piece{products.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {products.map((product, index) => {
                const sortedImages = [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
                const primaryImage = sortedImages[0];
                const sizeCount = [...new Set(product.skus.map((s) => s.size))].length;
                const hasCompare = product.compare_price && product.compare_price > product.base_price;
                const gradient = GRADIENTS[index % GRADIENTS.length];
                const stock = product.skus.reduce((sum, s) => sum + (s.stock_quantity ?? 0), 0);
                const soldOut = stock <= 0;
                const lowStock = stock > 0 && stock <= 3;
                return (
                  <Link key={product.id} href={`/products/${product.slug}`} className="group block" aria-label={`View ${product.name}`}>
                    <div className="relative w-full overflow-hidden bg-es-bone mb-3">
                      <div style={{ paddingBottom: "125%" }} />
                      <span className="absolute top-2.5 right-2.5 z-10 text-white text-[9px] font-extrabold uppercase tracking-wide px-2 py-1 bg-es-char/80">
                        Plus Size
                      </span>
                      {(soldOut || lowStock) && (
                        <span className="absolute top-2.5 left-2.5 z-10 text-white text-[9px] font-extrabold uppercase tracking-wide px-2 py-1" style={{ background: soldOut ? "#555" : "#c0392b" }}>
                          {soldOut ? "Sold out" : `Only ${stock} left`}
                        </span>
                      )}
                      {primaryImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={primaryImage.url} alt={primaryImage.alt ?? product.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-[1.03]`} />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] tracking-[.4em] uppercase text-es-mute">Thrift · Plus Size</p>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xl font-bold leading-tight text-es-ink" style={{ fontFamily: "var(--font-bodoni)" }}>{product.name}</p>
                        {sizeCount > 0 && <span className="mt-1 shrink-0 text-[10px] tracking-[.34em] uppercase text-es-mute whitespace-nowrap">{sizeCount} {sizeCount === 1 ? "SIZE" : "SIZES"}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm tracking-[.28em] text-es-ink">{formatKES(product.base_price)}</span>
                        {hasCompare && <span className="text-sm tracking-[.28em] text-es-mute line-through">{formatKES(product.compare_price!)}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
