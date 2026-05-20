"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const results = trimmed
    ? PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(trimmed.toLowerCase())
      )
    : [];

  return (
    <main className="min-h-screen bg-es-white">
      {/* Search input section */}
      <div
        className="mx-auto w-full max-w-[700px] px-6 sm:px-16"
        style={{ paddingTop: "120px", paddingBottom: "48px" }}
      >
        <label htmlFor="search-input" className="sr-only">
          Search for pieces, fabrics, styles
        </label>
        <input
          id="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for pieces, fabrics, styles…"
          autoFocus
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: "1.5px solid #0a0a0a",
            outline: "none",
            fontSize: "24px",
            fontFamily: "var(--font-inter), sans-serif",
            color: "#0a0a0a",
            padding: "8px 0",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderBottomColor = "#3d1a4a";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderBottomColor = "#0a0a0a";
          }}
        />
      </div>

      {/* Results area */}
      {trimmed && (
        <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-16 pb-20">
          {results.length === 0 ? (
            <p
              className="text-center text-xl"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontStyle: "italic",
                color: "#717171",
              }}
            >
              No pieces found for &lsquo;{trimmed}&rsquo;
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {results.map((product, index) => {
                const sizeCount = [
                  ...new Set(product.skus.map((s) => s.size)),
                ].length;
                const hasCompare =
                  product.compare_price &&
                  product.compare_price > product.base_price;
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
          )}
        </div>
      )}
    </main>
  );
}
