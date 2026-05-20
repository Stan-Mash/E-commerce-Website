import Link from "next/link";
import { ElitePlate } from "@/components/es/ElitePlate";
import { formatKES } from "@/lib/utils";

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
  },
];

const GRADIENTS = [
  "from-[#e8dff0] to-[#c9a96130]",
  "from-[#e6e0d8] to-[#d4b88030]",
  "from-[#dce8e0] to-[#8fbfaa30]",
  "from-[#e8e0d0] to-[#c9a96120]",
  "from-[#dde0e8] to-[#7a8fbf30]",
  "from-[#e8ddd8] to-[#bf9a8f30]",
];

export default function WomanPage() {
  const products = PRODUCTS.filter((p) => p.category === "Woman");

  return (
    <main className="min-h-screen bg-es-paper">
      {/* Editorial hero */}
      <div className="relative w-full" style={{ height: "60vh" }}>
        <ElitePlate kind="woman" tone="smoke" className="absolute inset-0" />
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
            The Woman
          </h1>
          <Link
            href="/products?category=Woman"
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
            WOMENSWEAR
          </p>
          <h2
            className="text-4xl sm:text-5xl font-bold leading-none tracking-tight text-es-ink"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            THE WOMAN&apos;S EDIT
          </h2>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {products.map((product, index) => {
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
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-[1.03]`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-[10px] tracking-[.4em] uppercase text-es-mute">
                    {product.category}
                  </p>
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
      </div>
    </main>
  );
}
