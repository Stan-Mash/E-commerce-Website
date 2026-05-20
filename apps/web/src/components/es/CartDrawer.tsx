"use client";

import Link from "next/link";
import { X, Trash2 } from "lucide-react";
import { useCart } from "@/components/checkout/CartProvider";

const fmt = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);

export function CartDrawer() {
  const { items, itemCount, subtotal, removeItem, updateQty, closeCart, isCartOpen } = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10,10,10,0.45)",
          zIndex: 100,
          opacity: isCartOpen ? 1 : 0,
          pointerEvents: isCartOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(440px, 100vw)",
          background: "var(--es-white, #ffffff)",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          transform: isCartOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          fontFamily: "var(--font-inter), 'Century Gothic', sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 28px 20px",
            borderBottom: "1px solid rgba(10,10,10,0.08)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 11,
              letterSpacing: ".34em",
              color: "var(--es-ink, #0a0a0a)",
              fontWeight: 600,
            }}
          >
            YOUR BAG ({itemCount})
          </span>
          <button
            onClick={closeCart}
            aria-label="Close bag"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--es-ink, #0a0a0a)",
              lineHeight: 0,
            }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 28px" }}>
          {items.length === 0 ? (
            /* Empty state */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 20,
                paddingBottom: 60,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-cormorant), Georgia, serif",
                  fontSize: 20,
                  fontStyle: "italic",
                  color: "var(--es-mute, #717171)",
                  margin: 0,
                }}
              >
                Your bag is empty
              </p>
              <Link
                href="/products"
                onClick={closeCart}
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 10,
                  letterSpacing: ".34em",
                  color: "var(--es-ink, #0a0a0a)",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--es-ink, #0a0a0a)",
                  paddingBottom: 2,
                }}
              >
                EXPLORE THE COLLECTION →
              </Link>
            </div>
          ) : (
            /* Item list */
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {items.map((item) => (
                <li
                  key={item.skuId}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "20px 0",
                    borderBottom: "1px solid rgba(10,10,10,0.06)",
                  }}
                >
                  {/* Image placeholder */}
                  <div
                    style={{
                      width: 64,
                      height: 80,
                      flexShrink: 0,
                      background: "var(--es-bone, #ede8df)",
                    }}
                  />

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-bodoni), Georgia, serif",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--es-ink, #0a0a0a)",
                        margin: "0 0 4px",
                        lineHeight: 1.3,
                      }}
                    >
                      {item.name}
                    </p>
                    {(item.size || item.color) && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--es-mute, #717171)",
                          margin: "0 0 8px",
                          fontFamily: "var(--font-inter), sans-serif",
                        }}
                      >
                        {[item.size, item.color].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p
                      style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: 13,
                        color: "var(--es-ink, #0a0a0a)",
                        margin: "0 0 10px",
                        fontWeight: 500,
                      }}
                    >
                      {fmt(item.price)}
                    </p>

                    {/* Qty + remove row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button
                          onClick={() => item.quantity > 1 ? updateQty(item.skuId, item.quantity - 1) : removeItem(item.skuId)}
                          aria-label="Decrease quantity"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "var(--font-inter), sans-serif",
                            fontSize: 16,
                            color: "var(--es-ink, #0a0a0a)",
                            padding: "0 2px",
                            lineHeight: 1,
                          }}
                        >
                          −
                        </button>
                        <span
                          style={{
                            fontFamily: "var(--font-inter), sans-serif",
                            fontSize: 13,
                            color: "var(--es-ink, #0a0a0a)",
                            minWidth: 16,
                            textAlign: "center",
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.skuId, item.quantity + 1)}
                          aria-label="Increase quantity"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "var(--font-inter), sans-serif",
                            fontSize: 16,
                            color: "var(--es-ink, #0a0a0a)",
                            padding: "0 2px",
                            lineHeight: 1,
                          }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.skuId)}
                        aria-label={`Remove ${item.name}`}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--es-mute, #717171)",
                          lineHeight: 0,
                          padding: 4,
                        }}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — only shown when cart has items */}
        {items.length > 0 && (
          <div style={{ padding: "0 28px 32px" }}>
            {/* Subtotal */}
            <div
              style={{
                borderTop: "1px solid rgba(10,10,10,0.10)",
                paddingTop: 20,
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 10,
                  letterSpacing: ".34em",
                  color: "var(--es-ink, #0a0a0a)",
                  fontWeight: 600,
                }}
              >
                SUBTOTAL
              </span>
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 14,
                  color: "var(--es-ink, #0a0a0a)",
                  fontWeight: 600,
                }}
              >
                {fmt(subtotal)}
              </span>
            </div>

            {/* CTA buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="es-btn-plum"
                style={{ textAlign: "center", width: "100%", boxSizing: "border-box" }}
              >
                PROCEED TO CHECKOUT →
              </Link>
              <button
                onClick={closeCart}
                className="es-btn-outline-ink"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  background: "none",
                }}
              >
                CONTINUE SHOPPING
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
