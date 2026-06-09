"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface WishProduct {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  compare_price: number | null;
  category: string;
  status: string;
  product_images: { url: string; sort_order: number }[];
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amount);
}

function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("es_wishlist") ?? "[]") as string[];
  } catch {
    return [];
  }
}

export default function WishlistPage() {
  const [products, setProducts] = useState<WishProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const ids = readWishlist();
    if (ids.length === 0) { setProducts([]); setLoading(false); return; }
    try {
      const res = await fetch(`/api/products/by-ids?ids=${encodeURIComponent(ids.join(","))}`);
      const data = await res.json();
      // Preserve the saved order, newest first.
      const byId = new Map<string, WishProduct>((data.products ?? []).map((p: WishProduct) => [p.id, p]));
      setProducts(ids.map((id) => byId.get(id)).filter(Boolean) as WishProduct[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function remove(id: string) {
    const next = readWishlist().filter((x) => x !== id);
    localStorage.setItem("es_wishlist", JSON.stringify(next));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <main className="min-h-screen bg-es-paper">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-16 py-12 sm:py-20">
        <p className="mb-3 text-[11px] tracking-[.48em] uppercase text-es-gold">Elite Style Co.</p>
        <h1 className="mb-10 text-4xl sm:text-5xl font-bold leading-none tracking-tight text-es-ink" style={{ fontFamily: "var(--font-bodoni)" }}>
          My Wishlist
        </h1>

        {loading ? (
          <p className="text-es-mute">Loading…</p>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-6 text-lg text-es-mute" style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic" }}>
              Your wishlist is empty. Tap the heart on any piece to save it here.
            </p>
            <Link href="/products" className="es-btn-outline-ink px-10 py-3 text-[11px] tracking-[.38em] uppercase">
              Browse the collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6">
            {products.map((product) => {
              const img = [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
              return (
                <div key={product.id} className="group relative">
                  <button
                    onClick={() => remove(product.id)}
                    aria-label="Remove from wishlist"
                    className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-es-ink"
                    style={{ border: "1px solid var(--es-bone)" }}
                  >
                    ×
                  </button>
                  <Link href={`/products/${product.slug}`} className="block">
                    <div className="relative w-full overflow-hidden bg-es-bone mb-3" style={{ paddingBottom: "125%" }}>
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.url} alt={product.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#e8dff0] to-[#c9a96130]" />
                      )}
                    </div>
                    <p className="text-[10px] tracking-[.4em] uppercase text-es-mute">{product.category}</p>
                    <p className="text-base font-bold leading-tight text-es-ink" style={{ fontFamily: "var(--font-bodoni)" }}>{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm tracking-[.28em] text-es-ink">{formatKES(product.base_price)}</span>
                      {product.compare_price && product.compare_price > product.base_price && (
                        <span className="text-sm tracking-[.28em] text-es-mute line-through">{formatKES(product.compare_price)}</span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
