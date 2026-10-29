"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Search, User, Heart, Menu, X } from "lucide-react";
import { useCart } from "@/components/checkout/CartProvider";

// ── Navigation structure ──────────────────────────────────────────────────────
// Two distinct shops, each with their own links. The header renders them as
// two labelled groups separated by a divider on desktop, and as two headed
// sections inside the mobile drawer.

const NEW_COLLECTION_NAV = [
  { label: "Women",    href: "/woman" },
  { label: "Men",      href: "/man" },
  { label: "Children", href: "/children" },
  { label: "New In",   href: "/products" },
] as const;

const THRIFT_NAV = [
  { label: "Plus Size", href: "/thrifted/plus-size" },
  { label: "Standard",  href: "/thrifted/standard" },
] as const;

const TOOLS_NAV = [
  { label: "Find My Style", href: "/style-finder" },
  { label: "Coming Soon",   href: "/coming-soon" },
] as const;

const MOBILE_ACCOUNT_LINKS = [
  { label: "Search",   href: "/search",   icon: Search },
  { label: "Wishlist", href: "/wishlist",  icon: Heart },
  { label: "Account",  href: "/account",   icon: User },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { itemCount, openCart } = useCart();
  const pathname = usePathname();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only hydration guard
  useEffect(() => { setMounted(true); }, []);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isThriftPage = pathname?.startsWith("/thrifted");

  return (
    <>
    <header className="bg-white border-b border-es-hair sticky top-0 z-50">

      {/* ── Desktop ── */}
      <div className="hidden lg:flex items-center justify-between px-8 h-16 max-w-[1440px] mx-auto w-full gap-6">

        {/* Wordmark */}
        <Link href="/" className="flex-shrink-0 no-underline" aria-label="Elite Style Co. home">
          <span className="font-cormorant text-[22px] font-semibold text-es-ink tracking-[-0.02em] whitespace-nowrap">
            Elite Style Co.
          </span>
        </Link>

        {/* Two-shop nav */}
        <nav className="flex items-center gap-0 flex-1 justify-center">

          {/* NEW COLLECTION group */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] tracking-[.42em] uppercase text-es-champagne-dk font-medium mr-2 whitespace-nowrap">
              New
            </span>
            {NEW_COLLECTION_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "font-sans text-[13px] font-medium px-3 py-1 transition-colors duration-150 no-underline whitespace-nowrap",
                  pathname === item.href
                    ? "text-es-ink bg-es-paper rounded"
                    : "text-es-char hover:text-es-ink",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-es-rule mx-4 flex-shrink-0" />

          {/* THRIFT STORE group */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] tracking-[.42em] uppercase font-medium mr-2 whitespace-nowrap" style={{ color: "#8a6840" }}>
              Thrift
            </span>
            {THRIFT_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "font-sans text-[13px] font-medium px-3 py-1 transition-colors duration-150 no-underline whitespace-nowrap",
                  pathname === item.href
                    ? "text-es-ink bg-es-paper rounded"
                    : "text-es-char hover:text-es-ink",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/thrifted"
              className={[
                "font-sans text-[11px] font-medium px-2 py-0.5 border transition-colors duration-150 no-underline whitespace-nowrap ml-1",
                isThriftPage
                  ? "border-es-char text-es-ink bg-es-paper"
                  : "border-es-rule text-es-mute hover:border-es-char hover:text-es-ink",
              ].join(" ")}
            >
              All Thrift
            </Link>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-es-rule mx-4 flex-shrink-0" />

          {/* Tools */}
          {TOOLS_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-sans text-[13px] font-medium text-es-char hover:text-es-champagne-dk transition-colors duration-150 no-underline px-3 py-1 whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {[
            { href: "/search",   icon: <Search size={18} strokeWidth={1.75} />,  label: "Search" },
            { href: "/wishlist", icon: <Heart  size={18} strokeWidth={1.75} />,  label: "Wishlist" },
            { href: "/account",  icon: <User   size={18} strokeWidth={1.75} />,  label: "Account" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              aria-label={a.label}
              className="flex items-center justify-center w-10 h-10 text-es-char hover:text-es-ink hover:bg-es-paper transition-colors duration-150"
            >
              {a.icon}
            </Link>
          ))}
          <button
            onClick={openCart}
            suppressHydrationWarning
            aria-label={`Bag, ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
            className="relative flex items-center justify-center w-10 h-10 bg-transparent border-0 cursor-pointer text-es-char hover:text-es-ink hover:bg-es-paper transition-colors duration-150"
          >
            <ShoppingBag size={18} strokeWidth={1.75} />
            {mounted && itemCount > 0 && (
              <span className="absolute top-1 right-1 bg-es-ink text-white rounded-full w-4 h-4 text-[9px] font-bold font-sans flex items-center justify-center leading-none">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile bar ── */}
      <div className="flex lg:hidden items-center justify-between px-4 h-14">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="bg-transparent border-0 cursor-pointer p-2 text-es-ink"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
        </button>

        <Link href="/" className="no-underline absolute left-1/2 -translate-x-1/2" aria-label="Elite Style Co. home">
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
            {mounted && itemCount > 0 && (
              <span className="absolute top-1 right-1 bg-es-ink text-white rounded-full w-4 h-4 text-[9px] font-bold font-sans flex items-center justify-center leading-none">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>

    {/* ── Mobile drawer ── */}
    {mobileOpen && (
      <div className="fixed inset-0 z-[100] flex lg:hidden flex-col bg-white">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-es-hair flex-shrink-0">
          <span className="font-cormorant text-[20px] font-semibold text-es-ink tracking-[-0.02em]">
            Elite Style Co.
          </span>
          <button onClick={() => setMobileOpen(false)} className="bg-transparent border-0 cursor-pointer p-2 text-es-ink" aria-label="Close menu">
            <X size={22} strokeWidth={1.75} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">

          {/* NEW COLLECTION section */}
          <div className="px-5 pt-6 pb-2">
            <p className="text-[10px] tracking-[.48em] uppercase text-es-champagne-dk font-medium mb-3">
              New Collection
            </p>
            {NEW_COLLECTION_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block font-sans text-[18px] font-medium text-es-ink no-underline py-3 border-b border-es-hair/40 hover:text-es-champagne-dk transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* THRIFT STORE section */}
          <div className="px-5 pt-6 pb-2">
            <p className="text-[10px] tracking-[.48em] uppercase font-medium mb-3" style={{ color: "#8a6840" }}>
              Thrift Store
            </p>
            <Link
              href="/thrifted"
              onClick={() => setMobileOpen(false)}
              className="block font-sans text-[18px] font-medium text-es-ink no-underline py-3 border-b border-es-hair/40 hover:text-es-champagne-dk transition-colors"
            >
              All Thrifted
            </Link>
            {THRIFT_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block font-sans text-[18px] font-medium text-es-ink no-underline py-3 border-b border-es-hair/40 hover:text-es-champagne-dk transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Tools section */}
          <div className="px-5 pt-6 pb-2">
            <p className="text-[10px] tracking-[.48em] uppercase text-es-mute font-medium mb-3">
              Discover
            </p>
            {TOOLS_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block font-sans text-[17px] font-medium text-es-char no-underline py-3 border-b border-es-hair/40 hover:text-es-ink transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Account links */}
          <div className="mt-4 border-t border-es-hair px-5 pt-4 pb-8">
            {MOBILE_ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 font-sans text-[15px] font-medium text-es-char no-underline py-3 border-b border-es-hair/40 hover:text-es-ink transition-colors"
              >
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    )}
    </>
  );
}
