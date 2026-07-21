"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

interface SkuInfo {
  size: string | null;
  color: string | null;
  products: { name: string } | { name: string }[] | null;
}
interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  skus: SkuInfo | SkuInfo[] | null;
}
interface PromotionInfo {
  code: string | null;
  type: string;
  value: number;
}
interface OrderRow {
  id: string;
  order_ref: string;
  status: string;
  total: number;
  delivery_type: string | null;
  phone: string;
  email: string | null;
  discount_amount: number;
  promotion_id: string | null;
  created_at: string;
  order_items: OrderItem[];
  customers: { phone: string; name: string | null; email: string | null } | null;
  promotions: PromotionInfo | PromotionInfo[] | null;
  lastContact: { at: string; by: string } | null;
}

type View = "active" | "expired";

const REFRESH_MS = 45 * 1000;

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function ageLabel(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
}

const DELIVERY_LABELS: Record<string, string> = {
  pickup: "Pickup",
  cbd: "Nairobi CBD",
  outside_cbd: "Outside CBD",
  door: "Delivery",
};

function itemsSummary(items: OrderItem[]): string {
  if (items.length === 0) return "—";
  const names = items.map((i) => {
    const sku = one(i.skus);
    const product = sku ? one(sku.products) : null;
    const label = product?.name ?? "Item";
    return sku?.size ? `${label} (${sku.size})` : label;
  });
  const shown = names.slice(0, 2).join(", ");
  return names.length > 2 ? `${shown} +${names.length - 2} more` : shown;
}

function recoveryWhatsAppLink(order: OrderRow): string | null {
  const phone = (order.customers?.phone ?? order.phone ?? "").replace(/\D/g, "").replace(/^0/, "254");
  if (!phone) return null;
  const name = order.customers?.name ? ` ${order.customers.name}` : "";
  const msg = encodeURIComponent(
    `Hi${name}! We noticed your Elite Style Co. order *${order.order_ref}* (${formatKES(Number(order.total))}) wasn't completed — your items are still reserved. Would you like us to resend the M-Pesa payment prompt, or is there anything we can help with?`
  );
  return `https://wa.me/${phone}?text=${msg}`;
}

function recoveryEmail(order: OrderRow): string | null {
  return order.email ?? order.customers?.email ?? null;
}

// Reuses the same admin_audit_log table other admin actions already write to
// (order.status, order.fulfilment) — see lib/audit.ts — rather than adding
// new schema just to track "was this customer already nudged."
async function recordContact(orderId: string) {
  try {
    await fetch(`/api/admin/orders/${orderId}/recovery-contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "whatsapp" }),
    });
  } catch {
    // best-effort — don't block the WhatsApp link over a logging failure
  }
}

export default function AbandonedCheckoutsPage() {
  const [view, setView] = useState<View>("active");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async (currentView: View, showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/abandoned?view=${currentView}`);
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      if (res.ok) {
        const json = await res.json();
        setOrders(json.orders ?? []);
        setActiveCount(json.activeCount ?? 0);
        setExpiredCount(json.expiredCount ?? 0);
      }
    } catch {
      // keep showing the last-known list rather than clearing it on a transient error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(view, true);
    const interval = setInterval(() => void load(view, false), REFRESH_MS);
    return () => clearInterval(interval);
  }, [view, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const name = (o.customers?.name ?? "").toLowerCase();
      const phone = (o.customers?.phone ?? o.phone ?? "").toLowerCase();
      return o.order_ref.toLowerCase().includes(q) || name.includes(q) || phone.includes(q);
    });
  }, [orders, search]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 8 }}>
            Sales
          </p>
          <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 36, fontWeight: 400, color: "var(--es-ink)", margin: 0 }}>
            Abandoned Checkouts
          </h1>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)", marginTop: 8, maxWidth: 620 }}>
            Reaching out is manual — nothing here sends automatically. This list refreshes itself
            every 45 seconds; use Refresh for an immediate update.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => void load(view, true)}
            style={{
              fontFamily: "var(--font-inter)", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase",
              padding: "9px 18px", border: "1px solid var(--es-bone)", borderRadius: 4, background: "var(--es-white)",
              color: "var(--es-ink)", cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            Refresh
          </button>
          <a
            href={`/api/admin/orders/abandoned/export?view=${view}`}
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: "var(--font-inter)", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase",
              padding: "9px 18px", border: "1px solid var(--es-bone)", borderRadius: 4, background: "var(--es-white)",
              color: "var(--es-ink)", textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            Export CSV
          </a>
        </div>
      </div>

      {/* View tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid var(--es-bone)" }}>
        {([
          { value: "active" as View, label: "Active", count: activeCount, hint: "stock still reserved" },
          { value: "expired" as View, label: "Recently Expired", count: expiredCount, hint: "stock released, still a lead" },
        ]).map((tab) => {
          const isActive = view === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setView(tab.value)}
              title={tab.hint}
              style={{
                fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase",
                padding: "10px 20px", background: "none", border: "none",
                borderBottom: isActive ? "2px solid var(--es-plum)" : "2px solid transparent",
                marginBottom: -2, color: isActive ? "var(--es-plum)" : "var(--es-mute)",
                cursor: "pointer", fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap",
              }}
            >
              {tab.label}
              <span style={{ marginLeft: 6, fontSize: 10, background: isActive ? "var(--es-plum-lt)" : "var(--es-bone)", color: isActive ? "var(--es-plum)" : "var(--es-mute)", padding: "2px 6px", borderRadius: 10 }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ref, phone, or name…"
          aria-label="Search abandoned checkouts"
          style={{
            width: "100%", maxWidth: 360, boxSizing: "border-box", padding: "10px 12px",
            border: "1px solid var(--es-bone)", background: "var(--es-white)", fontFamily: "var(--font-inter)",
            fontSize: 13, color: "var(--es-ink)", outline: "none",
          }}
        />
      </div>

      <p role="status" aria-live="polite" style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "var(--es-mute)", marginBottom: 12 }}>
        {loading ? "Loading…" : `Showing ${filtered.length} of ${orders.length} ${view === "active" ? "active" : "recently expired"} abandoned checkout${orders.length === 1 ? "" : "s"}`}
      </p>

      <div style={{ overflowX: "auto" }}>
        <table aria-label={`${view === "active" ? "Active" : "Recently expired"} abandoned checkouts`} style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-inter)" }}>
          <thead>
            <tr style={{ background: "var(--es-ink)" }}>
              {["Order Ref", "Age", "Customer", "Items", "Delivery", "Total", "Contacted", ""].map((col) => (
                <th
                  key={col}
                  scope="col"
                  style={{ padding: "14px 18px", textAlign: "left", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#ffffff", fontWeight: 500, whiteSpace: "nowrap" }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: "48px 20px", textAlign: "center", color: "var(--es-mute)" }}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "48px 20px", textAlign: "center", color: "var(--es-mute)" }}>
                  {search
                    ? "No matches for that search."
                    : view === "active"
                    ? "No active abandoned checkouts right now."
                    : "No recently expired checkouts in the last 48 hours."}
                </td>
              </tr>
            ) : (
              filtered.map((order, i) => {
                const waLink = recoveryWhatsAppLink(order);
                const email = recoveryEmail(order);
                const promo = one(order.promotions);
                return (
                  <tr key={order.id} style={{ background: i % 2 === 0 ? "var(--es-white)" : "var(--es-paper)" }}>
                    <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600, color: "var(--es-ink)" }}>
                      <Link href={`/admin/orders/${order.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {order.order_ref}
                      </Link>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: "var(--es-mute)", whiteSpace: "nowrap" }} title={absoluteTime(order.created_at)}>
                      {ageLabel(order.created_at)}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: "var(--es-ink)" }}>
                      <div>{order.customers?.name ? `${order.customers.name} · ${order.phone}` : order.phone}</div>
                      {email && <div style={{ fontSize: 11, color: "var(--es-mute)" }}>{email}</div>}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 12, color: "var(--es-ink)", maxWidth: 220 }}>
                      {itemsSummary(order.order_items)}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 12, color: "var(--es-mute)", whiteSpace: "nowrap" }}>
                      {DELIVERY_LABELS[order.delivery_type ?? ""] ?? order.delivery_type ?? "—"}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 14, fontWeight: 600, color: "var(--es-ink)", whiteSpace: "nowrap" }}>
                      {formatKES(Number(order.total))}
                      {promo?.code && (
                        <div style={{ fontSize: 10, fontWeight: 400, color: "var(--es-champagne-dk, #8c7262)" }}>
                          Code {promo.code}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 11, color: order.lastContact ? "#2e7d32" : "var(--es-mute)", whiteSpace: "nowrap" }}>
                      {order.lastContact ? `✓ ${ageLabel(order.lastContact.at)}` : "—"}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {waLink ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Recover order ${order.order_ref} on WhatsApp`}
                          onClick={() => void recordContact(order.id)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, letterSpacing: "0.1em",
                            textTransform: "uppercase", padding: "8px 16px", border: "1px solid #25D366", borderRadius: 4,
                            color: "#1a1a1a", background: "#e8faf0", textDecoration: "none", whiteSpace: "nowrap",
                          }}
                        >
                          Recover on WhatsApp
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--es-mute)" }}>No phone</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
