"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Promotions", href: "/admin/promotions" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Returns", href: "/admin/returns" },
  { label: "POS", href: "/admin/pos" },
  { label: "Stock", href: "/admin/stock" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Settings", href: "/admin/settings" },
] as const;

const OWNER_NAV = [
  { label: "Finance", href: "/admin/finance" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

const activeStyle: React.CSSProperties = {
  color: "var(--es-gold)",
  borderLeft: "2px solid var(--es-gold)",
  background: "rgba(201,169,97,0.08)",
  paddingLeft: 26, // compensate for 2px border so text doesn't shift
};

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Nav Links */}
      <ul style={{ listStyle: "none", padding: "0", margin: 0 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                style={{
                  display: "block",
                  padding: "12px 28px",
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: active ? "var(--es-gold)" : "#a0a0a0",
                  textDecoration: "none",
                  transition: "color 0.15s, background 0.15s",
                  minHeight: "unset",
                  ...(active ? activeStyle : {}),
                }}
                className="admin-nav-link"
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Owner-only nav */}
      <div style={{ margin: "24px 0 0", borderTop: "1px solid #222", paddingTop: 16 }}>
        <span
          style={{
            display: "block",
            padding: "0 28px 8px",
            fontFamily: "var(--font-inter)",
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#333",
          }}
        >
          Owner Only
        </span>
        {OWNER_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "10px 28px",
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--es-gold)",
                textDecoration: "none",
                ...(active ? activeStyle : {}),
              }}
              className="admin-nav-link"
            >
              {item.label} 🔒
            </Link>
          );
        })}
      </div>
    </>
  );
}
