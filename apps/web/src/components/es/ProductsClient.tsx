"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { compareSizes } from "@/lib/sizeGuide";

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
  skus: { size: string; color?: string | null; color_hex?: string | null; stock_quantity: number }[];
}

type SortOption = "featured" | "price-asc" | "price-desc" | "newest";

/** Total stock across a product's SKUs. */
function totalStock(p: ProductRow): number {
  return (p.skus ?? []).reduce((sum, s) => sum + (s.stock_quantity ?? 0), 0);
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
  "from-[#dde0e8] to-[#7a8fbf30]",
  "from-[#e8ddd8] to-[#bf9a8f30]",
];

const CATEGORY_LABELS: Record<string, string> = {
  women: "Woman",
  men: "Man",
  children: "Children",
  accessories: "Accessories",
};

const SORT_LABELS: Record<SortOption, string> = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  newest: "Newest",
};

// ---------------------------------------------------------------------------
// Wishlist button
// ---------------------------------------------------------------------------
function WishlistButton({ productId }: { productId: string }) {
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("es_wishlist") ?? "[]") as string[];
      setInWishlist(stored.includes(productId));
    } catch {
      // ignore
    }
  }, [productId]);

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const stored = JSON.parse(localStorage.getItem("es_wishlist") ?? "[]") as string[];
        const next = inWishlist
          ? stored.filter((id) => id !== productId)
          : [...stored, productId];
        localStorage.setItem("es_wishlist", JSON.stringify(next));
        setInWishlist(!inWishlist);
      } catch {
        // ignore
      }
    },
    [inWishlist, productId]
  );

  return (
    <button
      onClick={toggle}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      className="es-wishlist-btn"
    >
      {inWishlist ? "♥" : "♡"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sort dropdown
// ---------------------------------------------------------------------------
function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
}) {
  return (
    <div className="es-sort-wrapper">
      <label htmlFor="es-sort" className="es-sort-label">
        Sort by
      </label>
      <select
        id="es-sort"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="es-sort-select"
      >
        {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
interface ProductsClientProps {
  products: ProductRow[];
  activeCategory: string;
}

export function ProductsClient({ products, activeCategory }: ProductsClientProps) {
  const [sort, setSort] = useState<SortOption>("featured");
  const [sizeFilter, setSizeFilter] = useState<string[]>([]);
  const [colorFilter, setColorFilter] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Category-filtered base set (drives both the grid and the facet options).
  const inCategory =
    activeCategory === "All"
      ? products
      : products.filter(
          (p) =>
            CATEGORY_LABELS[p.category.toLowerCase()] === activeCategory ||
            p.category.toLowerCase() === activeCategory.toLowerCase()
        );

  // Build facet options from the category set.
  const allSizes = [
    ...new Set(inCategory.flatMap((p) => p.skus?.map((s) => s.size) ?? [])),
  ].filter(Boolean).sort(compareSizes);
  const allColors = [
    ...new Set(
      inCategory.flatMap((p) => p.skus?.map((s) => s.color).filter(Boolean) ?? [])
    ),
  ] as string[];
  const priceCeiling = Math.max(0, ...inCategory.map((p) => p.base_price));

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const filtered = inCategory.filter((p) => {
    if (inStockOnly && totalStock(p) <= 0) return false;
    if (maxPrice !== null && p.base_price > maxPrice) return false;
    if (sizeFilter.length > 0 && !(p.skus ?? []).some((s) => sizeFilter.includes(s.size)))
      return false;
    if (
      colorFilter.length > 0 &&
      !(p.skus ?? []).some((s) => s.color && colorFilter.includes(s.color))
    )
      return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price-asc") return a.base_price - b.base_price;
    if (sort === "price-desc") return b.base_price - a.base_price;
    return 0;
  });

  const activeFilterCount =
    sizeFilter.length + colorFilter.length + (inStockOnly ? 1 : 0) + (maxPrice !== null ? 1 : 0);

  const clearFilters = () => {
    setSizeFilter([]); setColorFilter([]); setInStockOnly(false); setMaxPrice(null);
  };

  return (
    <>
      {/* No apostrophes (or any character requiring HTML-entity escaping)
          inside this template literal: <style> is an HTML raw-text element,
          so the browser never decodes character references in it, but
          React still HTML-escapes them when serializing server-rendered
          text. Server text then permanently disagrees with the client's
          hydration text, breaking hydration for this whole component. The
          sort-dropdown arrow below is an inline SVG data URI with percent-
          encoded %27 in place of every literal apostrophe for exactly this
          reason — do not "simplify" it back to literal quotes. */}
      <style>{`
        /* Product card hover effects */
        .es-card-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background-color: var(--color-es-bone, #f0ece4);
          margin-bottom: 0.75rem;
        }
        .es-card-img,
        .es-card-placeholder {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .es-card:hover .es-card-img,
        .es-card:hover .es-card-placeholder {
          transform: scale(1.03);
        }
        .es-card {
          display: block;
          transition: box-shadow 0.3s ease;
        }
        .es-card:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }

        /* Quick view overlay */
        .es-quick-view {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.55);
          color: #fff;
          text-align: center;
          font-size: 10px;
          letter-spacing: 0.38em;
          text-transform: uppercase;
          padding: 10px 0;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .es-card:hover .es-quick-view {
          opacity: 1;
        }

        /* Wishlist button */
        .es-wishlist-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.85);
          border: none;
          cursor: pointer;
          font-size: 16px;
          line-height: 32px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          z-index: 10;
          transition: background 0.2s ease, transform 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        .es-wishlist-btn:hover {
          background: rgba(255,255,255,1);
          transform: scale(1.1);
        }

        /* Sort dropdown */
        .es-sort-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .es-sort-label {
          font-size: 11px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: var(--color-es-mute, #9a9080);
          white-space: nowrap;
        }
        .es-sort-select {
          font-size: 11px;
          letter-spacing: 0.18em;
          border: 1px solid var(--color-es-bone, #e8e0d4);
          background: transparent;
          color: var(--color-es-ink, #1a1510);
          padding: 6px 28px 6px 10px;
          appearance: none;
          -webkit-appearance: none;
          background-image: url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2710%27%20height=%276%27%20viewBox=%270%200%2010%206%27%3E%3Cpath%20d=%27M0%200l5%206%205-6z%27%20fill=%27%239a9080%27/%3E%3C/svg%3E);
          background-repeat: no-repeat;
          background-position: right 10px center;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .es-sort-select:hover,
        .es-sort-select:focus {
          border-color: var(--color-es-ink, #3d2b4a);
        }

        /* Count badge */
        .es-product-count {
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--color-es-mute, #9a9080);
        }

        /* Controls row */
        .es-controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
        }

        /* Filters */
        .es-filter-toggle {
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--color-es-ink, #1a1510);
          background: transparent;
          border: 1px solid var(--color-es-bone, #e8e0d4);
          padding: 6px 14px;
          cursor: pointer;
          transition: border-color .2s;
        }
        .es-filter-toggle:hover { border-color: var(--color-es-ink, #3d2b4a); }
        .es-filter-panel {
          display: flex;
          flex-wrap: wrap;
          gap: 28px;
          align-items: flex-end;
          padding: 20px 0 28px;
          margin-bottom: 24px;
          border-top: 1px solid var(--color-es-bone, #e8e0d4);
          border-bottom: 1px solid var(--color-es-bone, #e8e0d4);
        }
        .es-filter-label {
          font-size: 10px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--color-es-mute, #9a9080);
          margin-bottom: 10px;
        }
        .es-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .es-chip {
          font-size: 11px;
          letter-spacing: 0.05em;
          padding: 6px 12px;
          border: 1px solid var(--color-es-bone, #e8e0d4);
          background: transparent;
          color: var(--color-es-ink, #1a1510);
          cursor: pointer;
          transition: all .15s;
        }
        .es-chip:hover { border-color: var(--color-es-ink, #3d2b4a); }
        .es-chip-on {
          background: var(--color-es-ink, #3d2b4a);
          color: #fff;
          border-color: var(--color-es-ink, #3d2b4a);
        }
        .es-checkbox {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; color: var(--color-es-ink, #1a1510); cursor: pointer;
        }
        .es-filter-clear {
          font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--color-es-ink, #3d2b4a); background: transparent;
          border: none; cursor: pointer; text-decoration: underline; padding: 0;
        }

        /* Low-stock urgency badge */
        .es-stock-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #c0392b;
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 8px;
          z-index: 5;
        }
      `}</style>

      {/* Controls row: count + filter toggle + sort */}
      <div className="es-controls-row">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="es-product-count">
            {sorted.length} {sorted.length === 1 ? "product" : "products"}
          </span>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="es-filter-toggle"
            aria-expanded={showFilters}
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="es-filter-panel">
          {allSizes.length > 0 && (
            <div className="es-filter-group">
              <p className="es-filter-label">Size</p>
              <div className="es-chip-row">
                {allSizes.map((s) => (
                  <button key={s} type="button"
                    className={`es-chip ${sizeFilter.includes(s) ? "es-chip-on" : ""}`}
                    onClick={() => toggle(sizeFilter, s, setSizeFilter)}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {allColors.length > 0 && (
            <div className="es-filter-group">
              <p className="es-filter-label">Colour</p>
              <div className="es-chip-row">
                {allColors.map((c) => (
                  <button key={c} type="button"
                    className={`es-chip ${colorFilter.includes(c) ? "es-chip-on" : ""}`}
                    onClick={() => toggle(colorFilter, c, setColorFilter)}>{c}</button>
                ))}
              </div>
            </div>
          )}
          <div className="es-filter-group">
            <p className="es-filter-label">Max price{maxPrice !== null ? `: ${formatKES(maxPrice)}` : ""}</p>
            <input type="range" min={0} max={priceCeiling || 10000} step={100} aria-label="Maximum price"
              value={maxPrice ?? (priceCeiling || 10000)}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={{ width: "100%", maxWidth: 240, accentColor: "var(--color-es-ink, #3d2b4a)" }} />
          </div>
          <div className="es-filter-group">
            <label className="es-checkbox">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
              In stock only
            </label>
          </div>
          {activeFilterCount > 0 && (
            <button type="button" className="es-filter-clear" onClick={clearFilters}>Clear all</button>
          )}
        </div>
      )}

      {/* Product grid */}
      {sorted.length === 0 ? (
        <p className="text-es-mute text-sm tracking-[.25em] uppercase">
          No products in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
          {sorted.map((product, index) => {
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
            const stock = totalStock(product);
            const lowStock = stock > 0 && stock <= 5;
            const soldOut = stock <= 0;

            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="es-card group"
                aria-label={`View ${product.name}`}
              >
                {/* Product image — 4:5 aspect ratio */}
                <div className="es-card-image-wrap">
                  {soldOut ? (
                    <span className="es-stock-badge" style={{ background: "#555" }}>Sold out</span>
                  ) : lowStock ? (
                    <span className="es-stock-badge">Only {stock} left</span>
                  ) : null}
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={primaryImage.alt ?? product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="es-card-img"
                    />
                  ) : (
                    <div
                      className={`es-card-placeholder bg-gradient-to-br ${gradient}`}
                    />
                  )}

                  {/* Quick view overlay */}
                  <div className="es-quick-view">View Product</div>

                  {/* Wishlist button */}
                  <WishlistButton productId={product.id} />
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
                      className="text-base sm:text-xl font-bold leading-tight text-es-ink"
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
    </>
  );
}
