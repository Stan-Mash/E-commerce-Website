import Link from "next/link";
import Image from "next/image";
import { AnimateIn } from "@/components/es/AnimateIn";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

const FONT = "'Inter','Urbanist',sans-serif";

interface CategoryConfig {
  label: string;
  sub: string;
  href: string;
  bg: string;
  accent: string;
  /** Exact category values to match (covers both new-collection and thrift variants). */
  categoryValues: string[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    label: "Women",
    sub: "Shop the Edit",
    href: "/woman",
    bg: "#1f1a17",
    accent: "#c9a961",
    categoryValues: ["women", "thrift-women"],
  },
  {
    label: "Men",
    sub: "Sharp Looks",
    href: "/man",
    bg: "#111820",
    accent: "#ffffff",
    categoryValues: ["men", "thrift-men"],
  },
  {
    label: "Children",
    sub: "Mini Style",
    href: "/children",
    bg: "#1a120a",
    accent: "#c9a961",
    categoryValues: ["children", "thrift-children"],
  },
];

const DIRECTIONS = ["left", "up", "right"] as const;

async function fetchCategoryImages(): Promise<Record<string, string | null>> {
  try {
    const supabase = createPublicSupabaseClient();
    const out: Record<string, string | null> = {};

    await Promise.all(
      CATEGORIES.map(async ({ label, categoryValues }) => {
        const { data } = await supabase
          .from("products")
          .select("product_images(url, sort_order)")
          .eq("status", "active")
          .in("category", categoryValues)
          .order("created_at", { ascending: false })
          .limit(10);

        for (const product of data ?? []) {
          const imgs = (
            (product.product_images as { url: string; sort_order: number }[] | null) ?? []
          );
          if (imgs.length > 0) {
            const sorted = [...imgs].sort((a, b) => a.sort_order - b.sort_order);
            out[label] = sorted[0]?.url ?? null;
            return;
          }
        }
        out[label] = null;
      })
    );

    return out;
  } catch {
    return {};
  }
}

export async function FamilyEditorial() {
  const categoryImages = await fetchCategoryImages();

  return (
    <section style={{ background: "#0a0a0a", padding: "72px 40px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Header */}
        <AnimateIn direction="fade">
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}>
            <div>
              <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 8px" }}>
                2026 Collection
              </p>
              <h2 style={{ fontFamily: FONT, fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>
                Shop by department
              </h2>
            </div>
            <Link
              href="/products"
              style={{
                fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#fff",
                textDecoration: "none", borderBottom: "2px solid #fff", paddingBottom: 2,
                letterSpacing: "0.02em", whiteSpace: "nowrap", opacity: 0.8,
              }}
            >
              View All →
            </Link>
          </div>
        </AnimateIn>

        {/* 3-col category grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}
          className="!grid-cols-1 md:!grid-cols-3"
        >
          {CATEGORIES.map((cat, index) => {
            const imageUrl = categoryImages[cat.label] ?? null;

            return (
              <AnimateIn key={cat.label} direction={DIRECTIONS[index] ?? "up"} delay={index * 0.12}>
                <Link
                  href={cat.href}
                  style={{ textDecoration: "none", display: "block" }}
                  className="group"
                >
                  {/* Panel */}
                  <div
                    style={{
                      background: cat.bg,
                      aspectRatio: "3/4",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: "32px 28px",
                    }}
                  >
                    {/* Background photo from DB */}
                    {imageUrl && (
                      <Image
                        src={imageUrl}
                        alt={cat.label}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        style={{ objectFit: "cover", objectPosition: "center top" }}
                        className="transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    )}

                    {/* Gradient overlay — deeper when photo present */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: imageUrl
                        ? "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)"
                        : "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
                    }} />

                    {/* Label */}
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <p style={{
                        fontFamily: FONT, fontSize: 10, fontWeight: 600,
                        color: cat.accent, textTransform: "uppercase",
                        letterSpacing: "0.2em", margin: "0 0 6px",
                      }}>
                        {cat.sub}
                      </p>
                      <p style={{
                        fontFamily: FONT, fontSize: 28, fontWeight: 900,
                        color: "#fff", margin: "0 0 16px", letterSpacing: "-0.02em",
                      }}>
                        {cat.label}
                      </p>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontFamily: FONT, fontSize: 11, fontWeight: 700,
                        color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em",
                        borderBottom: "1px solid rgba(255,255,255,0.4)",
                        paddingBottom: 3,
                      }}>
                        Shop Now →
                      </span>
                    </div>
                  </div>
                </Link>
              </AnimateIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
