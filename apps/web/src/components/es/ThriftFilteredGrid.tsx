"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { formatKES } from "@/lib/utils";

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
  "from-[#e8e4dc] to-[#b5a08030]",
  "from-[#ddd8cc] to-[#a08b6030]",
  "from-[#e0d8cc] to-[#c4a87030]",
  "from-[#d8d0c4] to-[#b09a7030]",
  "from-[#e4dcd4] to-[#c8a88030]",
  "from-[#dcd4c8] to-[#b89a6830]",
];

type GenderTab = "all" | "women" | "men" | "children";

const WOMEN_CATS = new Set(["thrift-women", "thrift-plus-women"]);
const MEN_CATS   = new Set(["thrift-men",   "thrift-plus-men"]);
const CHILD_CATS = new Set(["thrift-children"]);

function matchesGender(category: string, tab: GenderTab): boolean {
  if (tab === "all") return true;
  if (tab === "women")    return WOMEN_CATS.has(category);
  if (tab === "men")      return MEN_CATS.has(category);
  if (tab === "children") return CHILD_CATS.has(category);
  return true;
}

function categoryLabel(category: string): string {
  if (WOMEN_CATS.has(category))    return "Thrift · Women";
  if (MEN_CATS.has(category))      return "Thrift · Men";
  if (CHILD_CATS.has(category))    return "Thrift · Children";
  if (category === "thrift-plus")  return "Thrift · Plus Size";
  return "Thrifted";
}

export function ThriftFilteredGrid({
  products,
  emptyMessage = "New pieces landing soon.",
  browseHref = "/thrifted",
}: {
  products: ProductRow[];
  emptyMessage?: string;
  browseHref?: string;
}) {
  const [tab, setTab] = useState<GenderTab>("all");

  const hasWomen    = products.some((p) => WOMEN_CATS.has(p.category));
  const hasMen      = products.some((p) => MEN_CATS.has(p.category));
  const hasChildren = products.some((p) => CHILD_CATS.has(p.category));
  const hasGenderData = hasWomen || hasMen || hasChildren;

  const visible = products.filter((p) => matchesGender(p.category, tab));

  return (
    <>
      {/* Gender filter tabs — only shown when there is gender-tagged stock */}
      {hasGenderData && (
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(201,169,97,0.2)", marginBottom: 32, overflowX: "auto" }}>
          {(["all", "women", "men", "children"] as GenderTab[]).map((t) => {
            const labels: Record<GenderTab, string> = { all: "All", women: "Women", men: "Men", children: "Children" };
            const isActive = tab === t;
            const hidden = t === "women" && !hasWomen || t === "men" && !hasMen || t === "children" && !hasChildren;
            if (hidden) return null;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: isActive ? "2px solid #c9a961" : "2px solid transparent",
                  color: isActive ? "#c9a961" : "#9a9080",
                  fontFamily: "var(--font-inter)",
                  fontSize: 10,
                  letterSpacing: "0.36em",
                  textTransform: "uppercase",
                  padding: "12px 18px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "color 0.15s, border-color 0.15s",
                  position: "relative",
                  top: 1,
                }}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-es-mute text-sm tracking-[.25em] uppercase mb-4">{emptyMessage}</p>
          <Link href={browseHref} className="inline-block px-8 py-3 bg-es-ink text-white text-[11px] tracking-[.35em] uppercase hover:opacity-80 transition-opacity">
            Browse All Thrift
          </Link>
        </div>
      ) : (
        <>
          <p className="font-sans text-[12px] text-es-mute mb-8">
            {visible.length} piece{visible.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {visible.map((product, index) => {
              const sortedImages = [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
              const primaryImage = sortedImages[0];
              const sizeCount = [...new Set(product.skus.map((s) => s.size))].length;
              const hasCompare = product.compare_price && product.compare_price > product.base_price;
              const gradient = GRADIENTS[index % GRADIENTS.length];
              const stock = product.skus.reduce((sum, s) => sum + (s.stock_quantity ?? 0), 0);
              const soldOut = stock <= 0;
              const lowStock = stock > 0 && stock <= 3;

              return (
                <Link key={product.id} href={`/products/${product.slug}`} className="group block" aria-label={`View ${product.name}`}>
                  <div className="relative w-full overflow-hidden bg-es-bone mb-3">
                    <div style={{ paddingBottom: "125%" }} />
                    <span className="absolute top-2.5 right-2.5 z-10 text-white text-[9px] font-extrabold uppercase tracking-wide px-2 py-1 bg-es-char/80">
                      Thrifted
                    </span>
                    {(soldOut || lowStock) && (
                      <span
                        className="absolute top-2.5 left-2.5 z-10 text-white text-[9px] font-extrabold uppercase tracking-wide px-2 py-1"
                        style={{ background: soldOut ? "#555" : "#c0392b" }}
                      >
                        {soldOut ? "Sold out" : `Only ${stock} left`}
                      </span>
                    )}
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={primaryImage.alt ?? product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-[1.03]`} />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] tracking-[.4em] uppercase text-es-mute">{categoryLabel(product.category)}</p>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xl font-bold leading-tight text-es-ink" style={{ fontFamily: "var(--font-bodoni)" }}>
                        {product.name}
                      </p>
                      {sizeCount > 0 && (
                        <span className="mt-1 shrink-0 text-[10px] tracking-[.34em] uppercase text-es-mute whitespace-nowrap">
                          {sizeCount} {sizeCount === 1 ? "SIZE" : "SIZES"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm tracking-[.28em] text-es-ink">{formatKES(product.base_price)}</span>
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
        </>
      )}
    </>
  );
}
