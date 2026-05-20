"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { GoldCrown } from "@/components/es/GoldCrown";
import { useCart } from "@/components/checkout/CartProvider";

const NAV_LEFT  = ["WOMAN", "MAN", "CHILDREN", "NEW IN", "JOURNAL"] as const;
const HAIR      = "rgba(10,10,10,0.10)";

export function SiteHeader() {
  const [active, setActive] = useState("WOMAN");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount, openCart } = useCart();

  return (
    <header
      style={{
        background: "#ffffff",
        borderBottom: `1px solid ${HAIR}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Desktop — 3-col grid */}
      <div
        className="hidden md:grid"
        style={{
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "22px 64px",
        }}
      >
        {/* Left nav */}
        <nav style={{ display: "flex", gap: 30 }}>
          {NAV_LEFT.map((item) => {
            const href =
              item === "NEW IN" ? "/products" :
              item === "JOURNAL" ? "/journal" :
              `/${item.toLowerCase()}`;
            return (
              <Link
                key={item}
                href={href}
                onClick={() => setActive(item)}
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 11,
                  letterSpacing: ".34em",
                  color: "#0a0a0a",
                  textDecoration: "none",
                  paddingBottom: 6,
                  borderBottom: active === item ? "2px solid #3d1a4a" : "2px solid transparent",
                  transition: "border-color .15s",
                }}
              >
                {item}
              </Link>
            );
          })}
        </nav>

        {/* Centre logo */}
        <Link href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none" }}>
          <GoldCrown size={24} />
          <span
            style={{
              fontFamily: "var(--font-bodoni), Georgia, serif",
              fontOpticalSizing: "auto",
              fontSize: 22,
              fontWeight: 800,
              color: "#0a0a0a",
              letterSpacing: "-.005em",
              lineHeight: 1,
            }}
          >
            Elite Style Co.
          </span>
        </Link>

        {/* Right actions */}
        <div
          style={{
            display: "flex",
            gap: 24,
            justifyContent: "flex-end",
            alignItems: "center",
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 11,
            letterSpacing: ".34em",
            color: "#0a0a0a",
          }}
        >
          <span>EN · KES</span>
          <Link href="/search" style={{ color: "inherit", lineHeight: 0 }} aria-label="Search">
            <Search size={16} strokeWidth={1.5} />
          </Link>
          <Link href="/account" style={{ color: "inherit", lineHeight: 0 }} aria-label="Account">
            <User size={16} strokeWidth={1.5} />
          </Link>
          <button
            onClick={openCart}
            aria-label={`Open bag, ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 11,
              letterSpacing: ".34em",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderBottom: "1px solid #0a0a0a",
              paddingBottom: 2,
              padding: 0,
            }}
          >
            BAG&nbsp;·&nbsp;{itemCount}
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div
        className="flex md:hidden"
        style={{ alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}
      >
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} aria-label="Toggle menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <Link href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textDecoration: "none" }}>
          <GoldCrown size={18} />
          <span style={{ fontFamily: "var(--font-bodoni), Georgia, serif", fontSize: 16, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-.005em" }}>
            Elite Style Co.
          </span>
        </Link>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/search" aria-label="Search" style={{ color: "#0a0a0a" }}><Search size={18} strokeWidth={1.5} /></Link>
          <button
            onClick={openCart}
            aria-label={`Open bag, ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#0a0a0a", lineHeight: 0, padding: 0, position: "relative" }}
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {itemCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  background: "#e53e3e",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: 14,
                  height: 14,
                  fontSize: 9,
                  fontFamily: "var(--font-inter), sans-serif",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav
          className="flex md:hidden"
          style={{
            flexDirection: "column",
            borderTop: `1px solid ${HAIR}`,
            background: "#ffffff",
          }}
        >
          {NAV_LEFT.map((item) => {
            const href =
              item === "NEW IN" ? "/products" :
              item === "JOURNAL" ? "/journal" :
              `/${item.toLowerCase()}`;
            return (
              <Link
                key={item}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 11,
                  letterSpacing: ".34em",
                  color: "#0a0a0a",
                  textDecoration: "none",
                  padding: "16px 20px",
                  borderBottom: `1px solid ${HAIR}`,
                }}
              >
                {item}
              </Link>
            );
          })}
          <div style={{ padding: "16px 20px", fontFamily: "var(--font-inter), sans-serif", fontSize: 11, letterSpacing: ".34em", color: "#717171" }}>
            EN · KES
          </div>
        </nav>
      )}
    </header>
  );
}
