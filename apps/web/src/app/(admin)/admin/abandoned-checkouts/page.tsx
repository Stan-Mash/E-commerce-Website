"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface OrderRow {
  id: string;
  order_ref: string;
  status: string;
  total: number;
  phone: string;
  created_at: string;
  order_items: Array<{ id: string }>;
  customers: { phone: string; name: string | null } | null;
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function ageLabel(createdAt: string): string {
  const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
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

// Reuses GET /api/admin/orders (same endpoint as the main Orders page) and
// filters client-side to pending_payment orders older than 15 minutes —
// checkout_and_reserve_stock() already reserved real stock for these, and
// the notifications cron independently emails a cart reminder; this view
// exists for admins to *manually* nudge a specific customer on WhatsApp
// (no automated messages are sent from here).
export default function AbandonedCheckoutsPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/orders");
        if (res.status === 401) { window.location.href = "/admin/login"; return; }
        if (res.ok) {
          const json = await res.json() as { orders: OrderRow[] };
          setOrders(json.orders ?? []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const abandoned = useMemo(
    () =>
      orders
        .filter((o) => o.status === "pending_payment")
        .filter((o) => Date.now() - new Date(o.created_at).getTime() > 15 * 60 * 1000)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [orders]
  );

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--es-gold)", marginBottom: 8 }}>
          Sales
        </p>
        <h1 style={{ fontFamily: "var(--font-bodoni)", fontSize: 36, fontWeight: 400, color: "var(--es-ink)", margin: 0 }}>
          Abandoned Checkouts
        </h1>
        <p style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--es-mute)", marginTop: 8, maxWidth: 560 }}>
          Orders where stock was reserved but payment never completed (STK timeout, abandoned card
          redirect, etc.), older than 15 minutes. Reaching out is manual — nothing here sends
          automatically.
        </p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-inter)" }}>
          <thead>
            <tr style={{ background: "var(--es-ink)" }}>
              {["Order Ref", "Age", "Customer", "Total", ""].map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "14px 20px",
                    textAlign: "left",
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "#ffffff",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: "48px 20px", textAlign: "center", color: "var(--es-mute)" }}>
                  Loading…
                </td>
              </tr>
            ) : abandoned.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "48px 20px", textAlign: "center", color: "var(--es-mute)" }}>
                  No abandoned checkouts right now.
                </td>
              </tr>
            ) : (
              abandoned.map((order, i) => {
                const link = recoveryWhatsAppLink(order);
                return (
                  <tr key={order.id} style={{ background: i % 2 === 0 ? "var(--es-white)" : "var(--es-paper)" }}>
                    <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600, color: "var(--es-ink)" }}>
                      <Link href={`/admin/orders/${order.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {order.order_ref}
                      </Link>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--es-mute)", whiteSpace: "nowrap" }}>
                      {ageLabel(order.created_at)}
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--es-ink)" }}>
                      {order.customers?.name ? `${order.customers.name} · ${order.phone}` : order.phone}
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 600, color: "var(--es-ink)", whiteSpace: "nowrap" }}>
                      {formatKES(Number(order.total))}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            padding: "8px 16px",
                            border: "1px solid #25D366",
                            borderRadius: 4,
                            color: "#1a1a1a",
                            background: "#e8faf0",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
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
