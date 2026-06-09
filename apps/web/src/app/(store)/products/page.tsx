import { Suspense } from "react";
import { ProductFilterTabs } from "@/components/es/ProductFilterTabs";
import { ProductsClient } from "@/components/es/ProductsClient";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProductRow {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  compare_price: number | null;
  category: string;
  product_images: { url: string; alt: string | null; sort_order: number }[];
  skus: { size: string; color: string | null; color_hex: string | null; stock_quantity: number }[];
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function getProducts(): Promise<ProductRow[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        `id, name, slug, base_price, compare_price, category,
         product_images(url, alt, sort_order),
         skus(size, color, color_hex, stock_quantity)`
      )
      .in("status", ["active", "coming_soon"])
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as unknown as ProductRow[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
interface PageProps {
  searchParams: { category?: string };
}

export const revalidate = 60; // ISR: refresh every 60 seconds

export default async function ProductsPage({ searchParams }: PageProps) {
  const activeCategory = searchParams.category ?? "All";
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-es-paper">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-16 py-10 sm:py-20">
        {/* Page header */}
        <header className="mb-8">
          <p className="mb-3 text-[11px] tracking-[.48em] uppercase text-es-gold">
            ELITE STYLE CO.
          </p>
          <h1
            className="mb-8 text-4xl sm:text-5xl font-bold leading-none tracking-tight text-es-ink"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            THE COLLECTION
          </h1>

          {/* Filter tabs: client component needs Suspense for useSearchParams */}
          <Suspense
            fallback={
              <div className="h-8 w-64 animate-pulse rounded bg-es-bone" />
            }
          >
            <ProductFilterTabs />
          </Suspense>
        </header>

        {/* Products: client component handles sort, wishlist, count */}
        <Suspense
          fallback={
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div
                    className="w-full bg-es-bone mb-3"
                    style={{ paddingBottom: "125%" }}
                  />
                  <div className="h-3 w-16 bg-es-bone rounded mb-2" />
                  <div className="h-5 w-32 bg-es-bone rounded mb-2" />
                  <div className="h-3 w-20 bg-es-bone rounded" />
                </div>
              ))}
            </div>
          }
        >
          <ProductsClient products={products} activeCategory={activeCategory} />
        </Suspense>
      </div>
    </main>
  );
}
