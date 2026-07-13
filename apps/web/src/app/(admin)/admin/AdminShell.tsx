"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSessionSync from "./AdminSessionSync";
import LogoutButton from "./LogoutButton";
import AdminNav from "./AdminNav";

// Below this width the sidebar becomes an off-canvas drawer opened by a
// hamburger button, instead of a permanent 240px column that leaves almost
// no room for page content on a phone screen.
const MOBILE_BREAKPOINT = 768;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  // Close the drawer whenever the route changes (tapping a nav link navigates).
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open on mobile, so the page behind
  // it doesn't scroll along with it.
  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [navOpen]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-inter)" }}>
      <style>{`
        .admin-nav-link:hover {
          color: var(--es-gold) !important;
          background: rgba(201,169,97,0.06) !important;
        }
        .admin-logout-link:hover {
          color: #e53e3e !important;
        }
        .admin-topbar { display: none; }
        .admin-backdrop { display: none; }

        @media (max-width: ${MOBILE_BREAKPOINT - 1}px) {
          .admin-topbar {
            display: flex;
            align-items: center;
            gap: 16px;
            position: sticky;
            top: 0;
            z-index: 120;
            background: var(--es-ink);
            padding: 14px 16px;
            width: 100%;
          }
          .admin-sidebar {
            /* !important: this must win over the element's inline
               position:sticky/height:100vh — inline styles otherwise beat
               an unmarked class rule, which left the sidebar's 100vh box
               sitting in normal flow (just visually offscreen), pushing all
               real content below the fold. */
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            height: 100vh !important;
            transform: translateX(-100%);
            transition: transform 0.22s ease;
            z-index: 200;
            box-shadow: 4px 0 24px rgba(0,0,0,0.25);
          }
          .admin-sidebar.is-open {
            transform: translateX(0);
          }
          .admin-backdrop.is-open {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 150;
          }
          .admin-main {
            padding: 20px 16px !important;
            width: 100%;
            min-width: 0;
          }
          .admin-shell-body {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="admin-shell-body" style={{ display: "flex", flex: 1, minWidth: 0 }}>
        {/* Mobile top bar: hamburger + wordmark. Hidden on desktop via CSS. */}
        <div className="admin-topbar">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            aria-expanded={navOpen}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 4,
              color: "#fff",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: 13,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--es-gold)",
            }}
          >
            Elite Style Co.
          </span>
        </div>

        {/* Tap-outside-to-close backdrop, mobile only */}
        <div
          className={`admin-backdrop${navOpen ? " is-open" : ""}`}
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <nav
          className={`admin-sidebar${navOpen ? " is-open" : ""}`}
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
          {/* Wordmark (desktop; mobile shows it in the top bar instead) */}
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
          className="admin-main"
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
    </div>
  );
}
