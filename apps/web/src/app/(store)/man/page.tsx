import Link from "next/link";
import { ElitePlate } from "@/components/es/ElitePlate";
import { formatKES } from "@/lib/utils";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

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
  "from-[#e8dff0] to-[#c9a96130]",
  "from-[#e6e0d8] to-[#d4b88030]",
  "from-[#dce8e0] to-[#8fbfaa30]",
  "from-[#e8e0d0] to-[#c9a96120]",
  "from-[#dde0e8] to-[#7a8fbf30]",
  "from-[#e8ddd8] to-[#bf9a8f30]",
];

async function getMenProducts(): Promise<ProductRow[]> {
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
      .eq("category", "men")
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as unknown as ProductRow[];
  } catch {
    return [];
  }
}

export const revalidate = 60;

export default async function ManPage() {
  const products = await getMenProducts();

  return (
    <main className="min-h-screen bg-es-paper">
      {/* Editorial hero */}
      <div className="relative w-full" style={{ height: "60vh" }}>
        <ElitePlate kind="man" tone="ink" className="absolute inset-0" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p
            className="mb-4 text-[11px] tracking-[.48em] uppercase"
            style={{ color: "#c9a961" }}
          >
            ELITE STYLE CO.
          </p>
          <h1
            className="mb-8 text-5xl sm:text-7xl font-bold leading-none text-white"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            The Man
          </h1>
          <Link
            href="/products?category=Man"
            className="es-btn-plum px-8 py-3 text-[11px] tracking-[.38em] uppercase"
          >
            Shop the Edit
          </Link>
        </div>
      </div>

      {/* Product section */}
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10 sm:px-16 sm:py-20">
        <header className="mb-10">
          <p className="mb-3 text-[11px] tracking-[.48em] uppercase text-es-gold">
            MENSWEAR
          </p>
          <h2
            className="text-4xl sm:text-5xl font-bold leading-none tracking-tight text-es-ink"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            THE MAN&apos;S EDIT
          </h2>
        </header>

        {products.length === 0 ? (
          <p className="text-es-mute text-sm tracking-[.25em] uppercase">
            New arrivals coming soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {products.map((product, index) => {
              const sortedImages = [...(product.product_images ?? [])].sort(
                (a, b) => a.sort_order - b.sort_order
              );
              const primaryImage = sortedImages[0];
              const sizeCount = [...new Set(product.skus.map((s) => s.size))].length;
              const hasCompare =
                product.compare_price && product.compare_price > product.base_price;
              const gradient = GRADIENTS[index % GRADIENTS.length];

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group block"
                  aria-label={`View ${product.name}`}
                >
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

                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] tracking-[.4em] uppercase text-es-mute">
                      Man
                    </p>
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
