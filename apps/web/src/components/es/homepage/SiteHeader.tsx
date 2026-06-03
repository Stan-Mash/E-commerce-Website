"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { useCart } from "@/components/checkout/CartProvider";

const NAV = [
  { label: "Women",       href: "/woman" },
  { label: "Men",         href: "/man" },
  { label: "Children",    href: "/children" },
  { label: "New In",      href: "/products" },
  { label: "Coming Soon", href: "/coming-soon" },
  { label: "Journal",     href: "/journal" },
] as const;

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount, openCart } = useCart();

  return (
    <header className="bg-white border-b border-es-hair sticky top-0 z-50">

      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between px-10 h-16 max-w-[1400px] mx-auto w-full">

        {/* Wordmark */}
        <Link href="/" className="flex-shrink-0 no-underline" aria-label="Elite Style Co. — home">
          <span className="font-cormorant text-[22px] font-semibold text-es-ink tracking-[-0.02em]">
            Elite Style Co.
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex gap-8 items-center">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-sans text-[13px] font-medium text-es-char hover:text-es-champagne-dk transition-colors duration-150 no-underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {[
            { href: "/search",  icon: <Search size={18} strokeWidth={1.75} />,  label: "Search" },
            { href: "/account", icon: <User   size={18} strokeWidth={1.75} />,  label: "Account" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              aria-label={a.label}
              className="flex items-center justify-center w-10 h-10 text-es-char hover:text-es-ink hover:bg-es-paper rounded-none transition-colors duration-150"
            >
              {a.icon}
            </Link>
          ))}

          <button
            onClick={openCart}
            aria-label={`Bag — ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
            className="relative flex items-center justify-center w-10 h-10 bg-transparent border-0 cursor-pointer text-es-char hover:text-es-ink hover:bg-es-paper transition-colors duration-150"
          >
            <ShoppingBag size={18} strokeWidth={1.75} />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 bg-es-ink text-white rounded-full w-4 h-4 text-[9px] font-bold font-sans flex items-center justify-center leading-none">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile bar */}
      <div className="flex md:hidden items-center justify-between px-4 h-14">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="bg-transparent border-0 cursor-pointer p-2 text-es-ink"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
        </button>

        <Link href="/" className="no-underline" aria-label="Elite Style Co. — home">
          <span className="font-cormorant text-[20px] font-semibold text-es-ink tracking-[-0.02em]">
            Elite Style Co.
          </span>
        </Link>

        <div className="flex gap-1 items-center">
          <Link href="/search" aria-label="Search" className="flex items-center justify-center w-10 h-10 text-es-char">
            <Search size={18} strokeWidth={1.75} />
          </Link>
          <button
            onClick={openCart}
            aria-label="Bag"
            className="relative flex items-center justify-center w-10 h-10 bg-transparent border-0 cursor-pointer text-es-char"
          >
            <ShoppingBag size={18} strokeWidth={1.75} />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 bg-es-ink text-white rounded-full w-4 h-4 text-[9px] font-bold font-sans flex items-center justify-center leading-none">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav className="flex md:hidden flex-col border-t border-es-hair bg-white">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="font-sans text-[15px] font-medium text-es-char no-underline px-5 py-4 border-b border-es-hair/50 hover:bg-es-paper transition-colors duration-150"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
