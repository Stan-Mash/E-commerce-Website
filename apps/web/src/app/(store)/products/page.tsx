import Link from "next/link";
import { Suspense } from "react";
import { ProductFilterTabs } from "@/components/es/ProductFilterTabs";

// ---------------------------------------------------------------------------
// Static seed data — used as fallback when Supabase is not connected
// ---------------------------------------------------------------------------
const PRODUCTS = [
  {
    id: "1",
    name: "Kikoy Wrap Dress",
    slug: "kikoy-wrap-dress",
    base_price: 8500,
    compare_price: 11000,
    category: "Woman",
    skus: [
      { id: "s1", size: "S", stock_quantity: 4 },
      { id: "s2", size: "M", stock_quantity: 6 },
      { id: "s3", size: "L", stock_quantity: 3 },
    ],
    product_images: [] as { url: string; alt: string }[],
  },
  {
    id: "2",
    name: "Maasai Bead Collar Shirt",
    slug: "maasai-bead-collar-shirt",
    base_price: 6200,
    compare_price: null,
    category: "Man",
    skus: [
      { id: "s4", size: "S", stock_quantity: 2 },
      { id: "s5", size: "M", stock_quantity: 5 },
      { id: "s6", size: "L", stock_quantity: 4 },
    ],
    product_images: [] as { url: string; alt: string }[],
  },
  {
    id: "3",
    name: "Ankara Print Jumpsuit",
    slug: "ankara-print-kids-jumpsuit",
    base_price: 4800,
    compare_price: null,
    category: "Children",
    skus: [
      { id: "s7", size: "2Y", stock_quantity: 8 },
      { id: "s8", size: "4Y", stock_quantity: 6 },
      { id: "s9", size: "6Y", stock_quantity: 4 },
    ],
    product_images: [] as { url: string; alt: string }[],
  },
  {
    id: "4",
    name: "Nairobi Linen Co-ord",
    slug: "nairobi-linen-co-ord",
    base_price: 12400,
    compare_price: null,
    category: "Woman",
    skus: [
      { id: "s10", size: "S", stock_quantity: 3 },
      { id: "s11", size: "M", stock_quantity: 4 },
    ],
    product_images: [] as { url: string; alt: string }[],
  },
  {
    id: "5",
    name: "Kitenge Baraza Shirt",
    slug: "kitenge-baraza-shirt",
    base_price: 5800,
    compare_price: null,
    category: "Man",
    skus: [
      { id: "s13", size: "M", stock_quantity: 5 },
      { id: "s14", size: "L", stock_quantity: 4 },
    ],
    product_images: [] as { url: string; alt: string }[],
  },
  {
    id: "6",
    name: "Shuka Check Romper",
    slug: "shuka-check-romper",
    base_price: 3200,
    compare_price: null,
    category: "Children",
    skus: [
      { id: "s16", size: "2Y", stock_quantity: 6 },
      { id: "s17", size: "4Y", stock_quantity: 5 },
    ],
    product_images: [] as { url: string; alt: string }[],
  },
];

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

// Gradient palettes for placeholder images — cycles through products
const PLACEHOLDER_GRADIENTS = [
  "from-[#e8dff0] to-[#c9a96130]",
  "from-[#e6e0d8] to-[#d4b88030]",
  "from-[#dce8e0] to-[#8fbfaa30]",
  "from-[#e8e0d0] to-[#c9a96120]",
  "from-[#dde0e8] to-[#7a8fbf30]",
  "from-[#e8ddd8] to-[#bf9a8f30]",
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
interface PageProps {
  searchParams: { category?: string };
}

export default function ProductsPage({ searchParams }: PageProps) {
  const activeCategory = searchParams.category ?? "All";

  const filtered =
    activeCategory === "All"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === activeCategory);

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
              const primaryImage = product.product_images?.[0];
              const sizeCount = [...new Set(product.skus.map((s) => s.size))]
                .length;
              const hasCompare =
                product.compare_price &&
                product.compare_price > product.base_price;
              const gradient =
                PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];

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
                      {product.category}
                    </p>

                    {/* Name + sizes row */}
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-xl font-bold leading-tight text-es-ink"
                        style={{ fontFamily: "var(--font-bodoni)" }}
                      >
                        {product.name}
                      </p>
                      <span className="mt-1 shrink-0 text-[10px] tracking-[.34em] uppercase text-es-mute whitespace-nowrap">
                        {sizeCount} SIZES
                      </span>
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
