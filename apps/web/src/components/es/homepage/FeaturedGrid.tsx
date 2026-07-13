import Link from "next/link";
import Image from "next/image";
import { createPublicSupabaseClient } from "@/lib/supabase/server";
import { AnimateIn } from "@/components/es/AnimateIn";

const FONT = "'Inter','Urbanist',sans-serif";

const CAT_LABEL: Record<string, string> = {
  women: "Women", men: "Men", children: "Children", accessories: "Accessories",
};

interface ProductRow {
  id: string; name: string; slug: string;
  base_price: number; compare_price: number | null; category: string;
  product_images: { url: string; alt: string | null; sort_order: number }[];
  skus: { size: string }[];
}

async function getProducts(): Promise<ProductRow[]> {
  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from("products")
      .select(`id, name, slug, base_price, compare_price, category,
               product_images(url, alt, sort_order), skus(size)`)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(8);
    return (data ?? []) as unknown as ProductRow[];
  } catch {
    return [];
  }
}

export async function FeaturedGrid() {
  const products = await getProducts();
  if (products.length === 0) return null;

  return (
    <section style={{ background: "#fff", padding: "72px 40px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Section header */}
        <AnimateIn direction="up">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 8px" }}>
                Just Landed
              </p>
              <h2 style={{ fontFamily: FONT, fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 900, color: "#111", margin: 0, letterSpacing: "-0.03em" }}>
                New Arrivals
              </h2>
            </div>
            <Link
              href="/products"
              style={{
                fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#111",
                textDecoration: "none", borderBottom: "2px solid #111", paddingBottom: 2,
                letterSpacing: "0.02em", whiteSpace: "nowrap",
              }}
            >
              View All →
            </Link>
          </div>
        </AnimateIn>

        {/* Grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}
          className="!grid-cols-2 lg:!grid-cols-4"
        >
          {products.map((product, index) => {
            const primaryImage = [...(product.product_images ?? [])]
              .sort((a, b) => a.sort_order - b.sort_order)[0];
            const sizeCount = [...new Set(product.skus.map((s) => s.size))].length;
            const hasDiscount = product.compare_price && product.compare_price > product.base_price;
            const pct = hasDiscount
              ? Math.round((1 - product.base_price / product.compare_price!) * 100)
              : 0;
            const cat = CAT_LABEL[product.category.toLowerCase()] ?? product.category;

            return (
              <AnimateIn key={product.id} direction="up" delay={index * 0.1}>
                <Link
                  href={`/products/${product.slug}`}
                  style={{ textDecoration: "none", display: "block" }}
                  className="group"
                >
                  {/* Image container */}
                  <div style={{
                    position: "relative",
                    aspectRatio: "3/4",
                    background: "#f5f5f5",
                    overflow: "hidden",
                    marginBottom: 14,
                  }}>
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={primaryImage.alt ?? product.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        style={{ objectFit: "cover", transition: "transform 0.5s ease" }}
                        className="group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#efefef" }} />
                    )}

                    {/* Discount badge */}
                    {hasDiscount && (
                      <span style={{
                        position: "absolute", top: 10, left: 10,
                        background: "#e63946", color: "#fff",
                        fontFamily: FONT, fontSize: 10, fontWeight: 800,
                        padding: "4px 8px", letterSpacing: "0.04em",
                      }}>
                        -{pct}%
                      </span>
                    )}

                    {/* New badge */}
                    <span style={{
                      position: "absolute", top: 10, right: 10,
                      background: "#111", color: "#fff",
                      fontFamily: FONT, fontSize: 9, fontWeight: 800,
                      padding: "4px 8px", letterSpacing: "0.1em", textTransform: "uppercase",
                    }}>
                      NEW
                    </span>

                    {/* Quick shop overlay */}
                    <div
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        background: "rgba(17,17,17,0.88)",
                        color: "#fff",
                        fontFamily: FONT, fontSize: 11, fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        textAlign: "center",
                        padding: "13px",
                      }}
                    >
                      Quick Shop
                    </div>
                  </div>

                  {/* Product info */}
                  <p style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 5px" }}>
                    {cat}
                  </p>
                  <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "#111", margin: "0 0 8px", lineHeight: 1.35 }}>
                    {product.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: "#111" }}>
                      KES {product.base_price.toLocaleString()}
                    </span>
                    {hasDiscount && (
                      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 400, color: "#aaa", textDecoration: "line-through" }}>
                        KES {product.compare_price!.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {sizeCount > 0 && (
                    <p style={{ fontFamily: FONT, fontSize: 11, color: "#aaa", margin: "5px 0 0" }}>
                      {sizeCount} size{sizeCount !== 1 ? "s" : ""} available
                    </p>
                  )}
                </Link>
              </AnimateIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
