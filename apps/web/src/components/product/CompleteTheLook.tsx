import Link from "next/link";
import Image from "next/image";
import { AddFullOutfitButton } from "@/components/product/AddFullOutfitButton";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LookProduct {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  compare_price: number | null;
  category: string;
  product_images: { url: string; alt: string | null; sort_order: number }[];
  skus: { stock_quantity: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Return complementary categories based on the product's own department.
// Men's products cross-sell other men's items; children cross-sell children's;
// accessories cross-sell women's; everything else cross-sells accessories.
function complementaryCategories(category: string): string[] {
  const cat = category.toLowerCase();
  // Men's products → suggest more men's pieces (not women's accessories)
  if ((cat.includes("men") || cat === "thrift-men") && !cat.includes("women")) {
    return ["men", "thrift-men"];
  }
  // Children's products → suggest more children's pieces
  if (cat.includes("children")) {
    return ["children", "thrift-children"];
  }
  // Accessories → suggest women's clothing to build an outfit
  if (cat.includes("accessor")) {
    return ["women", "thrift-women"];
  }
  // Women's, thrift-women, fallback → suggest accessories to complete the look
  return ["accessories"];
}

const PLACEHOLDER_GRADIENTS = [
  "from-[#eeece8] to-[#c9b3a030]",
  "from-[#e6e0d8] to-[#d4b88030]",
  "from-[#dce8e0] to-[#8fbfaa30]",
];

// ─── Data fetch ───────────────────────────────────────────────────────────────

const TIMEOUT_MS = 5_000;

async function getComplementaryProducts(
  category: string,
  currentProductId: string
): Promise<LookProduct[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  try {
    const { createPublicSupabaseClient } = await import(
      "@/lib/supabase/server"
    );
    const supabase = createPublicSupabaseClient();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const { data, error } = await supabase
      .from("products")
      .select(
        `id, name, slug, base_price, compare_price, category,
         product_images(url, alt, sort_order),
         skus(stock_quantity)`
      )
      .eq("status", "active")
      .in("category", complementaryCategories(category))
      .neq("id", currentProductId)
      .limit(4)
      .abortSignal(controller.signal);

    clearTimeout(timer);

    if (error) {
      console.error("[complete-the-look] Supabase error:", error.message);
      return [];
    }
    return (data as unknown as LookProduct[]) ?? [];
  } catch (err) {
    console.error("[complete-the-look] Query failed:", (err as Error).message);
    return [];
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  category: string;
  currentProductId: string;
}

export async function CompleteTheLook({ category, currentProductId }: Props) {
  const products = await getComplementaryProducts(category, currentProductId);
  // Need at least 2 items to show the section — 1 looks like an error, 0 is empty.
  if (products.length < 2) return null;

  return (
    <section className="mt-16 mb-12">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] tracking-[.45em] uppercase text-es-champagne-dk mb-2">
            ELITE STYLE CO.
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold leading-tight text-es-ink"
            style={{ fontFamily: "var(--font-bodoni)", letterSpacing: "-0.01em" }}
          >
            Complete the Look
          </h2>
          <p className="mt-2 text-sm text-es-mute">
            Pair it with these to finish the outfit.
          </p>
        </div>
        <AddFullOutfitButton
          items={products.map((p) => ({
            id: p.id,
            name: p.name,
            base_price: p.base_price,
            imageUrl: p.product_images?.[0]?.url ?? null,
            skuId: (p as unknown as { skus: { id?: string }[] }).skus?.[0]?.id ?? p.id,
          }))}
        />
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6">
        {products.map((product, index) => {
          const sortedImages = [...(product.product_images ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order
          );
          const primaryImage = sortedImages[0];
          const inStock = product.skus?.some((s) => s.stock_quantity > 0);
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
              {/* Image — 4:5 */}
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
                    className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
                  />
                )}
                {!inStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <span className="text-[10px] tracking-[.3em] uppercase text-es-mute">
                      Sold Out
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1">
                <p className="text-[10px] tracking-[.4em] uppercase text-es-mute">
                  {product.category}
                </p>
                <p
                  className="text-base font-bold leading-tight text-es-ink"
                  style={{ fontFamily: "var(--font-bodoni)" }}
                >
                  {product.name}
                </p>
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
