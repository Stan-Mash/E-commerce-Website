import { Suspense } from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton";
import type { ProductListItem } from "@nairobi-fashion/lib";

async function FeaturedProducts() {
  const supabase = createServerSupabaseClient();
  const { data: products, error } = await supabase
    .from("products")
    .select(
      `id, name, slug, base_price, compare_price,
       product_images(url, alt, sort_order),
       skus(id, size, stock_quantity)`
    )
    .eq("status", "active")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error || !products) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
      {(products as ProductListItem[]).map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

async function NewArrivals() {
  const supabase = createServerSupabaseClient();
  const { data: products } = await supabase
    .from("products")
    .select(
      `id, name, slug, base_price, compare_price,
       product_images(url, alt, sort_order),
       skus(id, size, stock_quantity)`
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(4);

  if (!products) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {(products as ProductListItem[]).map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-end bg-ink overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-placeholder.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />
        </div>
        <div className="relative z-10 w-full px-4 pb-12 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <p className="text-brand-300 font-display text-sm tracking-widest uppercase mb-3">
            New Collection · 2026
          </p>
          <h1 className="font-display text-4xl sm:text-6xl text-white leading-tight mb-6 max-w-xl">
            Nairobi&rsquo;s Finest. <br />
            <span className="text-brand-400">Yours Now.</span>
          </h1>
          <p className="text-white/80 text-base sm:text-lg mb-8 max-w-md">
            Kenyan-crafted fashion for men, women, and children. Pay with M-Pesa. Pickup in Westlands.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className="btn-primary">
              Shop Collection
            </Link>
            <Link href="/products?category=new" className="btn-secondary border-white/60 text-white hover:bg-white/10">
              New Arrivals
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Women", href: "/products?category=women", emoji: "👗" },
            { label: "Men", href: "/products?category=men", emoji: "👔" },
            { label: "Kids", href: "/products?category=children", emoji: "🧒" },
          ].map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="card flex flex-col items-center justify-center py-8 gap-2 hover:border-brand-300 hover:shadow-md transition-all"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="font-semibold text-sm text-ink">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl sm:text-3xl text-ink">Featured Pieces</h2>
          <Link href="/products?featured=true" className="text-sm text-brand-500 font-semibold hover:underline">
            View all →
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <FeaturedProducts />
        </Suspense>
      </section>

      {/* New Arrivals */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl sm:text-3xl text-ink">New Arrivals</h2>
          <Link href="/products?sort=newest" className="text-sm text-brand-500 font-semibold hover:underline">
            View all →
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <NewArrivals />
        </Suspense>
      </section>

      {/* M-Pesa trust banner */}
      <section className="bg-surface-warm py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-center">
          {[
            { icon: "📱", label: "M-Pesa Checkout", sub: "Instant STK Push" },
            { icon: "🏪", label: "Nairobi Pickup", sub: "Westlands Flagship" },
            { icon: "🔄", label: "Easy Returns", sub: "14-day policy" },
            { icon: "🔒", label: "Secure Shopping", sub: "TLS + RLS encrypted" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1 min-w-[100px]">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold text-sm text-ink">{item.label}</span>
              <span className="text-xs text-ink-muted">{item.sub}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
