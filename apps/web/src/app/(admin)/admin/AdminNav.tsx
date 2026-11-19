"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Clock, AlertCircle,
  Package, Layers, RotateCcw, Users, Star, Percent,
  Mail, Truck, Monitor, BarChart2, Settings,
  DollarSign, Activity, Lock, ChevronRight,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard",          href: "/admin",                     icon: LayoutDashboard },
      { label: "Orders",             href: "/admin/orders",               icon: ShoppingCart },
      { label: "Pending Payments",   href: "/admin/pending-payments",     icon: Clock,        countKey: "pendingPayments" as const },
      { label: "Abandoned Carts",    href: "/admin/abandoned-checkouts",  icon: AlertCircle,  countKey: "abandoned" as const },
      { label: "POS Terminal",       href: "/admin/pos",                  icon: Monitor },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { label: "Products",           href: "/admin/products",             icon: Package },
      { label: "Stock",              href: "/admin/stock",                icon: Layers },
      { label: "Returns",            href: "/admin/returns",              icon: RotateCcw },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers",          href: "/admin/customers",            icon: Users },
      { label: "Reviews",            href: "/admin/reviews",              icon: Star },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Promotions",         href: "/admin/promotions",           icon: Percent },
      { label: "Newsletter",         href: "/admin/newsletter",           icon: Mail },
      { label: "Delivery Zones",     href: "/admin/delivery",             icon: Truck },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Reports",            href: "/admin/reports",              icon: BarChart2 },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings",           href: "/admin/settings",             icon: Settings },
    ],
  },
] as const;

const OWNER_ITEMS = [
  { label: "Finance",       href: "/admin/finance",  icon: DollarSign },
  { label: "Activity Log",  href: "/admin/audit",    icon: Activity },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

const COUNT_POLL_MS = 2 * 60 * 1000;

export default function AdminNav() {
  const pathname = usePathname();
  const [abandonedCount, setAbandonedCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const [aRes, pRes] = await Promise.all([
          fetch("/api/admin/orders/abandoned/count"),
          fetch("/api/admin/orders/pending-buy-goods/count"),
        ]);
        if (!cancelled && aRes.ok) {
          const d = await aRes.json() as { count?: number };
          setAbandonedCount(typeof d.count === "number" ? d.count : null);
        }
        if (!cancelled && pRes.ok) {
          const d = await pRes.json() as { count?: number };
          setPendingCount(typeof d.count === "number" ? d.count : null);
        }
      } catch { /* nav badges are best-effort */ }
    }
    void poll();
    const id = setInterval(poll, COUNT_POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  function getBadge(countKey?: "abandoned" | "pendingPayments") {
    if (!countKey) return null;
    const n = countKey === "abandoned" ? abandonedCount : pendingCount;
    if (!n) return null;
    return (
      <span style={{
        marginLeft: "auto",
        background: "#dc2626",
        color: "#fff",
        fontSize: 10,
        fontWeight: 700,
        borderRadius: 10,
        padding: "1px 6px",
        lineHeight: 1.6,
        flexShrink: 0,
      }}>
        {n}
      </span>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
      {NAV_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: 4 }}>
          <p style={{
            fontFamily: "var(--font-inter)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#404040",
            margin: "16px 0 4px",
            padding: "0 16px",
          }}>
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const countKey = "countKey" in item ? item.countKey : undefined;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="admin-nav-link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 16px",
                  margin: "1px 8px",
                  borderRadius: 7,
                  fontFamily: "var(--font-inter)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#fff" : "#999",
                  textDecoration: "none",
                  background: active ? "rgba(201,169,97,0.15)" : "transparent",
                  transition: "all 0.12s",
                  minHeight: 40,
                  boxSizing: "border-box",
                }}
              >
                <Icon
                  size={16}
                  color={active ? "var(--es-gold)" : "#555"}
                  style={{ flexShrink: 0 }}
                />
                <span style={{ flex: 1, color: active ? "var(--es-gold)" : undefined }}>{item.label}</span>
                {getBadge(countKey)}
                {active && !countKey && (
                  <ChevronRight size={12} color="var(--es-gold)" style={{ opacity: 0.6, flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </div>
      ))}

      {/* Owner-only section */}
      <div style={{
        margin: "16px 8px 0",
        borderTop: "1px solid #1e1e1e",
        paddingTop: 12,
      }}>
        <p style={{
          fontFamily: "var(--font-inter)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#c9a961",
          opacity: 0.6,
          margin: "0 0 4px",
          padding: "0 8px",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}>
          <Lock size={9} />
          Owner
        </p>
        {OWNER_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="admin-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 16px",
                margin: "1px 0",
                borderRadius: 7,
                fontFamily: "var(--font-inter)",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--es-gold)" : "#666",
                textDecoration: "none",
                background: active ? "rgba(201,169,97,0.12)" : "transparent",
                transition: "all 0.12s",
                minHeight: 40,
              }}
            >
              <Icon size={16} color={active ? "var(--es-gold)" : "#555"} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              <Lock size={11} color="var(--es-gold)" style={{ opacity: 0.5, flexShrink: 0 }} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
