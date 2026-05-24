import Link from "next/link";
import { Suspense } from "react";
import { ProductFilterTabs } from "@/components/es/ProductFilterTabs";
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
  skus: { size: string; stock_quantity: number }[];
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function getProducts(): Promise<ProductRow[]> {
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
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as unknown as ProductRow[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Gradient palettes for products without images — cycles through
const PLACEHOLDER_GRADIENTS = [
  "from-[#e8dff0] to-[#c9a96130]",
  "from-[#e6e0d8] to-[#d4b88030]",
  "from-[#dce8e0] to-[#8fbfaa30]",
  "from-[#e8e0d0] to-[#c9a96120]",
  "from-[#dde0e8] to-[#7a8fbf30]",
  "from-[#e8ddd8] to-[#bf9a8f30]",
];

// Map DB category values to display labels
const CATEGORY_LABELS: Record<string, string> = {
  women: "Woman",
  men: "Man",
  children: "Children",
  accessories: "Accessories",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
interface PageProps {
  searchParams: { category?: string };
}

export const revalidate = 60; // ISR — refresh every 60 seconds

export default async function ProductsPage({ searchParams }: PageProps) {
  const activeCategory = searchParams.category ?? "All";
  const products = await getProducts();

  const filtered =
    activeCategory === "All"
      ? products
      : products.filter(
          (p) =>
            CATEGORY_LABELS[p.category.toLowerCase()] === activeCategory ||
            p.category.toLowerCase() === activeCategory.toLowerCase()
        );

  return (
    <main className="min-h-screen bg-es-paper">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10 sm:px-16 sm:py-20">
        {/* Page header */}
        <header className="mb-10">
          <p className="mb-3 text-[11px] tracking-[.48em] uppercase text-es-gold">
            ELITE STYLE CO.
          </p>
          <h1
            className="mb-8 text-4xl sm:text-5xl font-bold leading-none tracking-tight text-es-ink"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            THE COLLECTION
          </h1>

          {/* Filter tabs — client component needs Suspense for useSearchParams */}
          <Suspense
            fallback={
              <div className="h-8 w-64 animate-pulse rounded bg-es-bone" />
            }
          >
            <ProductFilterTabs />
          </Suspense>
        </header>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <p className="text-es-mute text-sm tracking-[.25em] uppercase">
            No products in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {filtered.map((product, index) => {
              const sortedImages = [...(product.product_images ?? [])].sort(
                (a, b) => a.sort_order - b.sort_order
              );
              const primaryImage = sortedImages[0];
              const sizeCount = [
                ...new Set(product.skus.map((s) => s.size)),
              ].length;
              const hasCompare =
                product.compare_price &&
                product.compare_price > product.base_price;
              const gradient =
                PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];
              const categoryLabel =
                CATEGORY_LABELS[product.category.toLowerCase()] ??
                product.category;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group block"
                  aria-label={`View ${product.name}`}
                >
                  {/* Product image — 4:5 aspect ratio */}
                  <div className="relative w-full overflow-hidden bg-es-bone mb-3">
                    <div style={{ paddingBottom: "125%" }} />
                    {primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={primaryImage.url}
                        alt={primaryImage.alt ?? product.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-[1.03]`}
                      />
                    )}
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col gap-1">
                    {/* Category label */}
                    <p className="text-[10px] tracking-[.4em] uppercase text-es-mute">
                      {categoryLabel}
                    </p>

                    {/* Name + sizes row */}
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-xl font-bold leading-tight text-es-ink"
                        style={{ fontFamily: "var(--font-bodoni)" }}
                      >
                        {product.name}
                      </p>
                      {sizeCount > 0 && (
                        <span className="mt-1 shrink-0 text-[10px] tracking-[.34em] uppercase text-es-mute whitespace-nowrap">
                          {sizeCount} {sizeCount === 1 ? "SIZE" : "SIZES"}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm tracking-[.28em] text-es-ink">
                        {formatKES(product.base_price)}
                      </span>
                      {hasCompare && (
                        <span className="text-sm tracking-[.28em] text-es-mute line-through">
                          {formatKES(product.compare_price!)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
