"use client";

import Link from "next/link";
import { ShoppingBag, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/checkout/CartProvider";

export function Header() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "Women", href: "/products?category=women" },
    { label: "Men", href: "/products?category=men" },
    { label: "Kids", href: "/products?category=children" },
    { label: "New Arrivals", href: "/products?sort=newest" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-surface-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu toggle */}
          <button
            className="sm:hidden p-2 -ml-2 rounded-lg hover:bg-surface-warm transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link href="/" className="font-display text-xl font-bold text-ink tracking-tight">
            Nairobi<span className="text-brand-500">Fashion</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-ink-soft hover:text-brand-500 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href="/search" className="p-2 rounded-lg hover:bg-surface-warm transition-colors" aria-label="Search">
              <Search size={20} />
            </Link>
            <Link
              href="/cart"
              className="relative p-2 rounded-lg hover:bg-surface-warm transition-colors"
              aria-label={`Cart, ${itemCount} items`}
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <nav className="sm:hidden border-t border-surface-warm bg-surface px-4 py-3 flex flex-col gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-sm font-medium text-ink border-b border-surface-warm last:border-0"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
