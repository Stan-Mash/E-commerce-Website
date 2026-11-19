"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";

const TABS: { label: string; value: string; href: string; thrifted?: true }[] = [
  { label: "ALL",           value: "All",         href: "/products" },
  { label: "WOMEN",         value: "Woman",        href: "/products?category=Woman" },
  { label: "MEN",           value: "Man",          href: "/products?category=Man" },
  { label: "CHILDREN",      value: "Children",     href: "/products?category=Children" },
  { label: "ACCESSORIES",   value: "Accessories",  href: "/products?category=Accessories" },
  { label: "SALE",          value: "Sale",         href: "/products?category=Sale" },
  { label: "THRIFTED ✦",    value: "Thrifted",     href: "/thrifted",  thrifted: true },
];

export function ProductFilterTabs() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "All";
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const active = pathname.startsWith("/thrifted") ? "Thrifted" : category;
  const barRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <style>{`
        .es-filter-tabs-bar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--color-es-paper, #f8f5f0);
          border-bottom: 1px solid rgba(26,21,16,0.08);
        }
        .es-filter-tabs-inner {
          display: flex;
          align-items: stretch;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none;
          -ms-overflow-style: none;
          gap: 0;
          padding: 0 4px;
          max-width: 1280px;
          margin: 0 auto;
          padding-left: max(16px, env(safe-area-inset-left));
          padding-right: max(16px, env(safe-area-inset-right));
        }
        .es-filter-tabs-inner::-webkit-scrollbar { display: none; }
        .es-filter-tab {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          padding: 14px 18px;
          font-size: 10px;
          letter-spacing: 0.36em;
          font-family: var(--font-inter, sans-serif);
          font-weight: 500;
          text-decoration: none;
          color: var(--color-es-mute, #9a9080);
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          transition: color 0.18s, border-color 0.18s;
          position: relative;
          top: 1px; /* sit on the 1px border */
        }
        .es-filter-tab:hover { color: var(--color-es-ink, #1a1510); }
        .es-filter-tab-active {
          color: var(--color-es-ink, #1a1510);
          border-bottom-color: var(--color-es-ink, #1a1510);
        }
        .es-filter-tab-thrifted {
          color: #b08d3a;
        }
        .es-filter-tab-thrifted:hover { color: #c9a961; }
        .es-filter-tab-thrifted-active {
          color: #c9a961;
          border-bottom-color: #c9a961;
        }
      `}</style>

      <nav
        className="es-filter-tabs-bar"
        aria-label="Filter products by category"
      >
        <div ref={barRef} className="es-filter-tabs-inner">
          {TABS.map(({ label, value, href, thrifted }) => {
            const isActive = active === value;
            const tabClass = [
              "es-filter-tab",
              thrifted ? "es-filter-tab-thrifted" : "",
              isActive
                ? thrifted
                  ? "es-filter-tab-thrifted-active"
                  : "es-filter-tab-active"
                : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <Link
                key={value}
                href={href}
                className={tabClass}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
