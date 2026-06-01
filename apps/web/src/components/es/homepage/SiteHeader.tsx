"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { useCart } from "@/components/checkout/CartProvider";

const NAV = [
  { label: "Women",    href: "/woman" },
  { label: "Men",      href: "/man" },
  { label: "Children", href: "/children" },
  { label: "New In",   href: "/products" },
  { label: "Coming Soon", href: "/coming-soon" },
  { label: "Journal",  href: "/journal" },
] as const;

const FONT = "'Inter','Urbanist',sans-serif";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount, openCart } = useCart();

  return (
    <header style={{
      background: "#fff",
      borderBottom: "1px solid #e8e8e8",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      {/* Desktop */}
      <div
        className="hidden md:flex"
        style={{
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          height: 64,
          maxWidth: 1400,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <span style={{
            fontFamily: FONT,
            fontSize: 20,
            fontWeight: 900,
            color: "#111",
            letterSpacing: "-0.03em",
          }}>
            Elite<span style={{ color: "#3d1a4a" }}>Style</span>
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 500,
                color: "#111",
                textDecoration: "none",
                letterSpacing: "0.01em",
                transition: "color .15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#3d1a4a")}
              onMouseLeave={e => (e.currentTarget.style.color = "#111")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/search"
            aria-label="Search"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, color: "#111", borderRadius: 6, transition: "background .15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f5")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <Search size={18} strokeWidth={2} />
          </Link>
          <Link
            href="/account"
            aria-label="Account"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, color: "#111", borderRadius: 6, transition: "background .15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f5")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <User size={18} strokeWidth={2} />
          </Link>
          <button
            onClick={openCart}
            aria-label={`Bag — ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#111",
              borderRadius: 6,
              transition: "background .15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f5")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <ShoppingBag size={18} strokeWidth={2} />
            {itemCount > 0 && (
              <span style={{
                position: "absolute",
                top: 4,
                right: 4,
                background: "#3d1a4a",
                color: "#fff",
                borderRadius: "50%",
                width: 16,
                height: 16,
                fontSize: 9,
                fontFamily: FONT,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}>
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div
        className="flex md:hidden"
        style={{ alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 56 }}
      >
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: "#111" }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 900, color: "#111", letterSpacing: "-0.03em" }}>
            Elite<span style={{ color: "#3d1a4a" }}>Style</span>
          </span>
        </Link>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Link href="/search" aria-label="Search" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, color: "#111" }}>
            <Search size={18} strokeWidth={2} />
          </Link>
          <button
            onClick={openCart}
            style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: "none", border: "none", cursor: "pointer", color: "#111" }}
            aria-label="Bag"
          >
            <ShoppingBag size={18} strokeWidth={2} />
            {itemCount > 0 && (
              <span style={{
                position: "absolute", top: 4, right: 4,
                background: "#3d1a4a", color: "#fff", borderRadius: "50%",
                width: 16, height: 16, fontSize: 9, fontFamily: FONT, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav
          className="flex md:hidden"
          style={{ flexDirection: "column", borderTop: "1px solid #e8e8e8", background: "#fff" }}
        >
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                fontFamily: FONT,
                fontSize: 15,
                fontWeight: 600,
                color: "#111",
                textDecoration: "none",
                padding: "16px 20px",
                borderBottom: "1px solid #f0f0f0",
                display: "block",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
