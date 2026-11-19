"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Search, User, Heart, Menu, X, ChevronDown } from "lucide-react";
import { useCart } from "@/components/checkout/CartProvider";

const PRIMARY_NAV = [
  { label: "Women",    href: "/woman" },
  { label: "Men",      href: "/man" },
  { label: "Children", href: "/children" },
  { label: "New In",   href: "/products" },
] as const;

const THRIFT_DROPDOWN = [
  { label: "New In",       href: "/thrifted" },
  { label: "All Thrifted", href: "/thrifted" },
  { label: "Plus Size",    href: "/thrifted/plus-size" },
  { label: "Standard",     href: "/thrifted/standard" },
] as const;

const SECONDARY_NAV = [
  { label: "Find My Style", href: "/style-finder" },
  { label: "Coming Soon",   href: "/coming-soon" },
] as const;

const MOBILE_ACCOUNT_LINKS = [
  { label: "Search",   href: "/search",  icon: Search },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "Account",  href: "/account",  icon: User },
] as const;

export function SiteHeader() {
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [thriftOpen, setThriftOpen]       = useState(false);
  const [mobileThriftOpen, setMobileThriftOpen] = useState(false);
  const [mounted, setMounted]             = useState(false);
  const { itemCount, openCart }           = useCart();
  const pathname                          = usePathname();
  const thriftRef                         = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (thriftRef.current && !thriftRef.current.contains(e.target as Node)) {
        setThriftOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isThriftPage = pathname?.startsWith("/thrifted");

  const navLinkClass = (href: string) =>
    [
      "font-sans text-[13px] tracking-[.04em] font-medium px-3.5 py-2 transition-colors duration-150 no-underline whitespace-nowrap",
      pathname === href
        ? "text-es-ink"
        : "text-es-char hover:text-es-ink",
    ].join(" ");

  return (
    <>
      <header className="bg-white border-b border-es-hair sticky top-0 z-50">

        {/* ── Desktop ── */}
        <div className="hidden lg:flex items-center justify-between px-10 h-[60px] max-w-[1440px] mx-auto w-full">

          {/* Wordmark */}
          <Link href="/" className="flex-shrink-0 no-underline mr-10" aria-label="Elite Style Co. home">
            <span className="font-cormorant text-[21px] font-semibold text-es-ink tracking-[-0.02em] whitespace-nowrap">
              Elite Style Co.
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-0 flex-1">
            {/* Primary items */}
            {PRIMARY_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                {item.label}
              </Link>
            ))}

            {/* Divider */}
            <div className="w-px h-4 bg-es-hair mx-3 flex-shrink-0" />

            {/* Thrift Store dropdown */}
            <div
              ref={thriftRef}
              className="relative"
              onMouseEnter={() => setThriftOpen(true)}
              onMouseLeave={() => setThriftOpen(false)}
            >
              <button
                onClick={() => setThriftOpen((v) => !v)}
                className={[
                  "flex items-center gap-1 font-sans text-[13px] tracking-[.04em] font-medium px-3.5 py-2 transition-colors duration-150 bg-transparent border-0 cursor-pointer whitespace-nowrap",
                  isThriftPage ? "text-es-ink" : "text-es-char hover:text-es-ink",
                ].join(" ")}
              >
                Thrift Store
                <ChevronDown
                  size={13}
                  strokeWidth={2}
                  className={`transition-transform duration-200 ${thriftOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown panel */}
              {thriftOpen && (
                <div className="absolute top-full left-0 mt-0 py-2 bg-white border border-es-hair shadow-sm min-w-[160px] z-50">
                  {THRIFT_DROPDOWN.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setThriftOpen(false)}
                      className={[
                        "block font-sans text-[13px] tracking-[.04em] font-medium px-5 py-2.5 no-underline transition-colors duration-150 whitespace-nowrap",
                        pathname === item.href
                          ? "text-es-ink bg-es-paper"
                          : "text-es-char hover:text-es-ink hover:bg-es-paper",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-es-hair mx-3 flex-shrink-0" />

            {/* Secondary */}
            {SECONDARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "font-sans text-[13px] tracking-[.04em] font-medium px-3.5 py-2 transition-colors duration-150 no-underline whitespace-nowrap",
                  pathname === item.href
                    ? "text-es-ink"
                    : "text-es-mute hover:text-es-ink",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-0.5 flex-shrink-0 ml-6">
            {[
              { href: "/search",   icon: <Search size={18} strokeWidth={1.6} />, label: "Search" },
              { href: "/wishlist", icon: <Heart  size={18} strokeWidth={1.6} />, label: "Wishlist" },
              { href: "/account",  icon: <User   size={18} strokeWidth={1.6} />, label: "Account" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                aria-label={a.label}
                className="flex items-center justify-center w-10 h-10 text-es-char hover:text-es-ink transition-colors duration-150"
              >
                {a.icon}
              </Link>
            ))}
            <button
              onClick={openCart}
              suppressHydrationWarning
              aria-label={`Bag, ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
              className="relative flex items-center justify-center w-10 h-10 ml-1 bg-es-ink text-white hover:bg-es-char transition-colors duration-150 border-0 cursor-pointer"
            >
              <ShoppingBag size={17} strokeWidth={1.6} />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-es-champagne-dk text-white rounded-full w-4 h-4 text-[9px] font-bold font-sans flex items-center justify-center leading-none">
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
            {mobileOpen ? <X size={21} strokeWidth={1.75} /> : <Menu size={21} strokeWidth={1.75} />}
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
          <div className="flex items-center justify-between px-5 h-14 border-b border-es-hair flex-shrink-0">
            <span className="font-cormorant text-[20px] font-semibold text-es-ink tracking-[-0.02em]">
              Elite Style Co.
            </span>
            <button onClick={() => setMobileOpen(false)} className="bg-transparent border-0 cursor-pointer p-2 text-es-ink" aria-label="Close menu">
              <X size={21} strokeWidth={1.75} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto">
            {/* New Collection */}
            <div className="px-6 pt-7 pb-3">
              <p className="text-[9px] tracking-[.5em] uppercase text-es-mute font-medium mb-4">
                New Collection
              </p>
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block font-sans text-[18px] font-medium text-es-ink no-underline py-3.5 border-b border-es-hair/50 hover:text-es-champagne-dk transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Thrift Store */}
            <div className="px-6 pt-6 pb-3">
              <button
                onClick={() => setMobileThriftOpen((v) => !v)}
                className="w-full flex items-center justify-between bg-transparent border-0 cursor-pointer p-0 mb-4"
              >
                <p className="text-[9px] tracking-[.5em] uppercase text-es-mute font-medium">
                  Thrift Store
                </p>
                <ChevronDown
                  size={13}
                  strokeWidth={2}
                  className={`text-es-mute transition-transform duration-200 ${mobileThriftOpen ? "rotate-180" : ""}`}
                />
              </button>
              {mobileThriftOpen && THRIFT_DROPDOWN.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block font-sans text-[18px] font-medium text-es-ink no-underline py-3.5 border-b border-es-hair/50 hover:text-es-champagne-dk transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              {!mobileThriftOpen && (
                <Link
                  href="/thrifted"
                  onClick={() => setMobileOpen(false)}
                  className="block font-sans text-[18px] font-medium text-es-ink no-underline py-3.5 border-b border-es-hair/50 hover:text-es-champagne-dk transition-colors"
                >
                  Shop All Thrift
                </Link>
              )}
            </div>

            {/* Discover */}
            <div className="px-6 pt-6 pb-3">
              <p className="text-[9px] tracking-[.5em] uppercase text-es-mute font-medium mb-4">
                Discover
              </p>
              {SECONDARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block font-sans text-[17px] font-medium text-es-char no-underline py-3.5 border-b border-es-hair/50 hover:text-es-ink transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Account */}
            <div className="mt-4 border-t border-es-hair px-6 pt-5 pb-8">
              {MOBILE_ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 font-sans text-[15px] font-medium text-es-char no-underline py-3.5 border-b border-es-hair/40 hover:text-es-ink transition-colors"
                >
                  <Icon size={17} strokeWidth={1.75} />
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
