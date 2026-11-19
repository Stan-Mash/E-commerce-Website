"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSessionSync from "./AdminSessionSync";
import LogoutButton from "./LogoutButton";
import AdminNav from "./AdminNav";
import { X, Menu } from "lucide-react";

// Page title map — shown in the top header
const PAGE_TITLES: Record<string, string> = {
  "/admin":                     "Dashboard",
  "/admin/orders":              "Orders",
  "/admin/pending-payments":    "Pending Payments",
  "/admin/abandoned-checkouts": "Abandoned Checkouts",
  "/admin/pos":                 "POS Terminal",
  "/admin/products":            "Products",
  "/admin/stock":               "Stock",
  "/admin/returns":             "Returns",
  "/admin/customers":           "Customers",
  "/admin/reviews":             "Reviews",
  "/admin/promotions":          "Promotions",
  "/admin/newsletter":          "Newsletter",
  "/admin/delivery":            "Delivery",
  "/admin/reports":             "Reports",
  "/admin/settings":            "Settings",
  "/admin/finance":             "Finance",
  "/admin/audit":               "Activity Log",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [key, label] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key + "/")) return label;
  }
  return "Admin";
}

const SIDEBAR_W = 240;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pageTitle = resolveTitle(pathname);
  const isPOS = pathname === "/admin/pos";

  // Close drawer on route change
  const [prev, setPrev] = useState(pathname);
  if (pathname !== prev) { setPrev(pathname); setDrawerOpen(false); }

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <div className="admin-root" style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-inter)", background: "#0a0a0a" }}>
      <style>{`
        /* ── Sidebar ──────────────────────────────────────────────── */
        .admin-sidebar {
          width: ${SIDEBAR_W}px;
          flex-shrink: 0;
          background: #111;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          overflow: hidden;
          z-index: 100;
          border-right: 1px solid #1a1a1a;
        }
        .admin-sidebar-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .admin-sidebar-inner::-webkit-scrollbar { display: none; }

        /* ── Mobile top bar ───────────────────────────────────────── */
        .admin-topbar {
          display: none;
        }

        /* ── Nav link hover ───────────────────────────────────────── */
        .admin-nav-link:hover {
          background: rgba(255,255,255,0.05) !important;
          color: #fff !important;
        }
        .admin-nav-link:hover svg { color: #c9a961 !important; }

        /* ── Backdrop ─────────────────────────────────────────────── */
        .admin-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(2px);
          z-index: 190;
        }
        .admin-backdrop.open { display: block; }

        /* ── Right column offset for fixed sidebar ────────────────── */
        .admin-right-column {
          margin-left: ${SIDEBAR_W}px;
        }

        /* ── Mobile layout ────────────────────────────────────────── */
        @media (max-width: 767px) {
          .admin-right-column {
            margin-left: 0 !important;
          }
          .admin-sidebar {
            top: 0; left: 0; bottom: 0;
            height: 100dvh !important;
            width: min(${SIDEBAR_W}px, 85vw) !important;
            transform: translateX(-110%);
            transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
            z-index: 200;
          }
          .admin-sidebar.open {
            transform: translateX(0);
            box-shadow: 8px 0 40px rgba(0,0,0,0.5);
          }
          .admin-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 120;
            background: #111;
            border-bottom: 1px solid #1a1a1a;
            padding: 0 16px;
            height: 56px;
            flex-shrink: 0;
          }
          .admin-main {
            padding: 20px 16px 80px !important;
          }
          .admin-body {
            flex-direction: column !important;
          }
        }

        /* ── Desktop top header ───────────────────────────────────── */
        .admin-desktop-header {
          display: none;
        }
        @media (min-width: 768px) {
          .admin-desktop-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 40px;
            height: 56px;
            flex-shrink: 0;
            border-bottom: 1px solid #1a1a1a;
            background: #111;
          }
        }

        @media (max-width: 1024px) and (min-width: 768px) {
          .admin-main { padding: 28px 24px !important; }
        }

        /* POS full-screen mode — no padding, locked height, no scroll */
        .admin-main.pos-mode {
          padding: 0 !important;
          overflow: hidden !important;
          height: calc(100vh - 56px) !important;
          flex: none !important;
          min-height: 0 !important;
        }
      `}</style>

      <div className="admin-body" style={{ display: "flex", flex: 1, minWidth: 0 }}>
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className={`admin-sidebar${drawerOpen ? " open" : ""}`} aria-label="Admin navigation">
          <div className="admin-sidebar-inner">
            {/* Brand */}
            <div style={{
              padding: "20px 16px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #1a1a1a",
              flexShrink: 0,
            }}>
              <div>
                <span style={{
                  fontFamily: "var(--font-bodoni)",
                  fontSize: 14,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--es-gold)",
                  display: "block",
                  lineHeight: 1.3,
                }}>
                  Elite Style Co.
                </span>
                <span style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#3a3a3a",
                  display: "block",
                  marginTop: 2,
                }}>
                  Admin Console
                </span>
              </div>
              {/* Close button — mobile only (hidden on desktop via opacity trick) */}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="admin-drawer-close"
                style={{
                  background: "none",
                  border: "1px solid #2a2a2a",
                  borderRadius: 6,
                  color: "#666",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Nav groups */}
            <AdminNav />

            {/* Logout */}
            <div style={{
              padding: "12px 16px 20px",
              borderTop: "1px solid #1a1a1a",
              flexShrink: 0,
            }}>
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        <div
          className={`admin-backdrop${drawerOpen ? " open" : ""}`}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />

        {/* ── Right column: topbar + main ─────────────────────── */}
        <div className="admin-right-column" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--es-paper)" }}>
          {/* Mobile top bar */}
          <div className="admin-topbar">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              style={{
                background: "none",
                border: "1px solid #2a2a2a",
                borderRadius: 7,
                color: "#aaa",
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                padding: 0,
              }}
            >
              <Menu size={18} />
            </button>
            <span style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: 13,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--es-gold)",
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}>
              Elite Style Co.
            </span>
            <div style={{ width: 38, flexShrink: 0 }} />
          </div>

          {/* Desktop page header */}
          <div className="admin-desktop-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{
                fontFamily: "var(--font-inter)",
                fontSize: 15,
                fontWeight: 600,
                color: "#e8e8e8",
                margin: 0,
                letterSpacing: "-0.01em",
              }}>
                {pageTitle}
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                color: "#3a3a3a",
                letterSpacing: "0.05em",
              }}>
                elitestyle.co.ke
              </span>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(201,169,97,0.15)",
                border: "1px solid rgba(201,169,97,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{ fontFamily: "var(--font-bodoni)", fontSize: 13, color: "var(--es-gold)" }}>E</span>
              </div>
            </div>
          </div>

          {/* Main content */}
          <main
            className={`admin-main${isPOS ? " pos-mode" : ""}`}
            style={{
              flex: 1,
              background: "var(--es-paper)",
              padding: "36px 40px",
              minWidth: 0,
              overflowX: "hidden",
            }}
          >
            {children}
          </main>
        </div>
      </div>

      <AdminSessionSync />
    </div>
  );
}
