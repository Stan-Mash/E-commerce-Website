import Link from "next/link";
import type { Metadata } from "next";

// Force all admin pages to be dynamically rendered so Next.js never serves
// a stale router-cache RSC response (e.g. a pre-login redirect to /admin/login).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Admin · Elite Style Co.",
    template: "%s · Admin · Elite Style Co.",
  },
};

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "POS", href: "/admin/pos" },
  { label: "Stock", href: "/admin/stock" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Reports", href: "/admin/reports" },
] as const;

const OWNER_NAV = [
  { label: "Finance", href: "/admin/finance" },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is enforced exclusively by middleware.ts (Edge Middleware).
  // A duplicate cookies() check here breaks RSC client-side navigation in
  // Next.js 14 because cookies() returns empty during partial renders.
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "var(--font-inter)",
      }}
    >
      {/* ── Sidebar ── */}
      <nav
        style={{
          width: 240,
          flexShrink: 0,
          background: "var(--es-ink)",
          display: "flex",
          flexDirection: "column",
          padding: "32px 0",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
        aria-label="Admin navigation"
      >
        {/* Wordmark */}
        <div style={{ padding: "0 28px 40px" }}>
          <span
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: 13,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--es-gold)",
              display: "block",
              lineHeight: 1.4,
            }}
          >
            Elite Style Co.
          </span>
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#555555",
              display: "block",
              marginTop: 4,
            }}
          >
            Admin Console
          </span>
        </div>

        {/* Nav Links */}
        <ul style={{ listStyle: "none", padding: "0", margin: 0 }}>
          {NAV_ITEMS.map((item) => (
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
                  color: "#a0a0a0",
                  textDecoration: "none",
                  transition: "color 0.15s, background 0.15s",
                  minHeight: "unset",
                }}
                className="admin-nav-link"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <style>{`
          .admin-nav-link:hover {
            color: var(--es-gold) !important;
            background: rgba(201,169,97,0.06) !important;
          }
          .admin-logout-link:hover {
            color: #e53e3e !important;
          }
        `}</style>

        {/* Owner-only nav */}
        <div style={{ margin: "24px 0 0", borderTop: "1px solid #222", paddingTop: 16 }}>
          <span style={{ display: "block", padding: "0 28px 8px", fontFamily: "var(--font-inter)", fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#333" }}>
            Owner Only
          </span>
          {OWNER_NAV.map(item => (
            <Link key={item.href} href={item.href}
              style={{ display: "block", padding: "10px 28px", fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a961", textDecoration: "none" }}
              className="admin-nav-link"
            >
              {item.label} 🔒
            </Link>
          ))}
        </div>

        {/* Logout */}
        <div style={{ marginTop: "auto", padding: "32px 28px 0" }}>
          <Link
            href="/api/admin/logout"
            className="admin-logout-link"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#555555",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
          >
            Logout
          </Link>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main
        style={{
          flex: 1,
          background: "var(--es-paper)",
          padding: 48,
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}

