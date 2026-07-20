"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatKES } from "@/lib/utils";

const KEY = "es_recently_viewed_v1";
const MAX_ITEMS = 8;

interface ViewedProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
}

function read(): ViewedProduct[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as ViewedProduct[];
  } catch {
    return [];
  }
}

/** Call from a product page to add the current product to the recently-viewed list. */
export function recordRecentlyViewed(product: ViewedProduct) {
  try {
    const existing = read().filter((p) => p.id !== product.id);
    const next = [product, ...existing].slice(0, MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — skip silently
  }
}

/** Renders the recently-viewed rail, excluding the product currently on screen. */
export function RecentlyViewed({ excludeProductId }: { excludeProductId?: string }) {
  const [items, setItems] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    setItems(read().filter((p) => p.id !== excludeProductId));
  }, [excludeProductId]);

  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-es-hair">
      <h2 className="font-cormorant font-semibold text-es-ink text-2xl mb-6">
        Recently Viewed
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((p) => (
          <Link key={p.id} href={`/products/${p.slug}`} className="group block">
            <div className="relative w-full overflow-hidden bg-es-bone mb-2" style={{ aspectRatio: "3 / 4" }}>
              {p.imageUrl && (
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <p className="text-xs text-es-ink line-clamp-1">{p.name}</p>
            <p className="text-xs text-es-mute">{formatKES(p.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
