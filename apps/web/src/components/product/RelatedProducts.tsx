import Link from "next/link";
import Image from "next/image";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RelatedProductRow {
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
// Helpers
// ---------------------------------------------------------------------------
function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
}

const PLACEHOLDER_GRADIENTS = [
  "from-[#e8dff0] to-[#c9a96130]",
  "from-[#e6e0d8] to-[#d4b88030]",
  "from-[#dce8e0] to-[#8fbfaa30]",
  "from-[#e8e0d0] to-[#c9a96120]",
];

const CATEGORY_LABELS: Record<string, string> = {
  women: "Woman",
  men: "Man",
  children: "Children",
  accessories: "Accessories",
};

// ---------------------------------------------------------------------------
// Data fetch
// ---------------------------------------------------------------------------
const RELATED_QUERY_TIMEOUT_MS = 6_000;

async function getRelated(
  category: string,
  currentProductId: string
): Promise<RelatedProductRow[]> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createPublicSupabaseClient } = await import(
        "@/lib/supabase/server"
      );
      const supabase = createPublicSupabaseClient();

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), RELATED_QUERY_TIMEOUT_MS);

      const { data, error } = await supabase
        .from("products")
        .select(
          `id, name, slug, base_price, compare_price, category,
           product_images(url, alt, sort_order),
           skus(size, stock_quantity)`
        )
        .eq("status", "active")
        .ilike("category", category)
        .neq("id", currentProductId)
        .limit(4)
        .abortSignal(controller.signal);

      clearTimeout(timer);

      if (!error && data && data.length > 0) {
        return data as unknown as RelatedProductRow[];
      }
      if (error) {
        console.error("[related-products] Supabase error:", error.message);
      }
    } catch (err) {
      console.error("[related-products] Query failed:", (err as Error).message);
    }
  }

  return [];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface Props {
  category: string;
  currentProductId: string;
}

export async function RelatedProducts({ category, currentProductId }: Props) {
  const products = await getRelated(category, currentProductId);

  if (products.length === 0) return null;

  return (
    <section className="mt-16 mb-12">
      {/* Section header */}
      <div className="mb-8">
        <p className="text-[11px] tracking-[.45em] uppercase text-es-gold mb-2">
          ELITE STYLE CO.
        </p>
        <h2
          className="text-2xl sm:text-3xl font-bold leading-tight text-es-ink"
          style={{ fontFamily: "var(--font-bodoni)", letterSpacing: "-0.01em" }}
        >
          You May Also Like
        </h2>
      </div>

      {/* 4-column grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6">
        {products.map((product, index) => {
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
            CATEGORY_LABELS[product.category.toLowerCase()] ?? product.category;

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
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.alt ?? product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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
                    className="text-base font-bold leading-tight text-es-ink"
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
    </section>
  );
}
