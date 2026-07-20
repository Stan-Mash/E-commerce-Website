import Link from "next/link";
import type { Metadata } from "next";
import { createPublicSupabaseClient } from "@/lib/supabase/server";
import { formatKES } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Coming Soon",
  description: "New arrivals landing soon at Elite Style Co. — bags, shoes, coats and more.",
  alternates: { canonical: "/coming-soon" },
};

export const revalidate = 60;

interface Row {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  category: string;
  product_images: { url: string; alt: string | null; sort_order: number }[];
}

async function getComingSoon(): Promise<Row[]> {
  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, base_price, category, product_images(url, alt, sort_order)")
      .eq("status", "coming_soon")
      .order("created_at", { ascending: true });
    return (data ?? []) as unknown as Row[];
  } catch {
    return [];
  }
}

export default async function ComingSoonPage() {
  const products = await getComingSoon();

  return (
    <main className="min-h-screen bg-es-paper">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-16 py-10 sm:py-20">
        <header className="mb-10 text-center">
          <p className="mb-3 text-[11px] tracking-[.48em] uppercase text-es-gold">
            ELITE STYLE CO.
          </p>
          <h1
            className="mb-4 text-4xl sm:text-5xl font-bold leading-none tracking-tight text-es-ink"
            style={{ fontFamily: "var(--font-bodoni)" }}
          >
            Coming Soon
          </h1>
          <p className="mx-auto max-w-xl text-es-mute" style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: 18 }}>
            A first look at what&rsquo;s landing next. Save your favourites — these
            drop soon.
          </p>
        </header>

        {products.length === 0 ? (
          <p className="text-center text-es-mute text-sm tracking-[.25em] uppercase">
            New pieces are on their way. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
            {products.map((product) => {
              const img = [...(product.product_images ?? [])].sort(
                (a, b) => a.sort_order - b.sort_order
              )[0];
              return (
                <Link key={product.id} href={`/products/${product.slug}`} className="group block">
                  <div className="relative w-full overflow-hidden bg-es-bone mb-3">
                    <div style={{ paddingBottom: "125%" }} />
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.url} alt={img.alt ?? product.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#e8dff0] to-[#c9a96130]" />
                    )}
                    <span
                      style={{
                        position: "absolute", top: 10, left: 10,
                        background: "var(--es-ink)", color: "#fff",
                        fontFamily: "var(--font-inter)", fontSize: 9, fontWeight: 800,
                        padding: "4px 8px", letterSpacing: "0.12em", textTransform: "uppercase",
                      }}
                    >
                      Coming Soon
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] tracking-[.4em] uppercase text-es-mute">{product.category}</p>
                    <p className="text-base sm:text-xl font-bold leading-tight text-es-ink" style={{ fontFamily: "var(--font-bodoni)" }}>
                      {product.name}
                    </p>
                    <span className="text-sm tracking-[.28em] text-es-ink">{formatKES(product.base_price)}</span>
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
