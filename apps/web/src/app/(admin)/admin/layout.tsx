import Link from "next/link";
import type { Metadata } from "next";
import AdminSessionSync from "./AdminSessionSync";
import LogoutButton from "./LogoutButton";
import AdminNav from "./AdminNav";
import { ToastProvider } from "@/components/admin";

// Force all admin pages to be dynamically rendered so Next.js never serves
// a stale router-cache RSC response (e.g. a pre-login redirect to /admin/login).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Admin · Elite Style Co.",
    template: "%s · Admin · Elite Style Co.",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is enforced exclusively by middleware.ts (Edge Middleware).
  // A duplicate cookies() check here breaks RSC client-side navigation in
  // Next.js 14 because cookies() returns empty during partial renders.
  return (
    <ToastProvider>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          fontFamily: "var(--font-inter)",
        }}
      >
        {/* Sidebar */}
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

          <style>{`
            .admin-nav-link:hover {
              color: var(--es-gold) !important;
              background: rgba(201,169,97,0.06) !important;
            }
            .admin-logout-link:hover {
              color: #e53e3e !important;
            }
          `}</style>

          {/* Nav Links + Owner Nav (client component for active highlighting) */}
          <AdminNav />

          {/* Logout — must be a form POST, not a <Link>, to prevent Next.js
              prefetch from calling GET /api/admin/logout and silently clearing
              session cookies on every page load. */}
          <div style={{ marginTop: "auto", padding: "32px 28px 0" }}>
            <LogoutButton />
          </div>
        </nav>

        {/* Clears stale esc_admin_token from localStorage (legacy cleanup) */}
        <AdminSessionSync />

        {/* Main Content */}
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
    </ToastProvider>
  );
}
