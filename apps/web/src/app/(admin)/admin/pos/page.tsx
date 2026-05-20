"use client";

import { useState, useEffect, useCallback } from "react";

interface SKU {
  id: string;
  sku_code: string;
  size: string;
  color: string | null;
  stock_quantity: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  base_price: number;
  skus: SKU[];
}

interface CartItem {
  sku_id: string;
  product_name: string;
  size: string;
  color: string | null;
  unit_price: number;
  quantity: number;
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cash">("cash");
  const [completing, setCompleting] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const json = await res.json() as { products: Product[] };
        setProducts(
          (json.products ?? []).filter(
            (p) => p.skus.some((s) => s.stock_quantity > 0)
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filtered = search.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  function addToCart(product: Product, sku: SKU) {
    setCart((prev) => {
      const existing = prev.findIndex((c) => c.sku_id === sku.id);
      if (existing >= 0) {
        return prev.map((c, i) =>
          i === existing ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          sku_id: sku.id,
          product_name: product.name,
          size: sku.size,
          color: sku.color,
          unit_price: product.base_price,
          quantity: 1,
        },
      ];
    });
  }

  function updateQty(skuId: string, delta: number) {
    setCart((prev) => {
      return prev
        .map((c) =>
          c.sku_id === skuId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0);
    });
  }

  function removeItem(skuId: string) {
    setCart((prev) => prev.filter((c) => c.sku_id !== skuId));
  }

  function clearCart() {
    setCart([]);
    setPhone("");
    setSuccessRef(null);
    setErrorMsg(null);
  }

  const subtotal = cart.reduce((s, c) => s + c.unit_price * c.quantity, 0);

  async function completeSale() {
    if (cart.length === 0) return;
    setCompleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone || "0700000000",
          payment_method: paymentMethod,
          items: cart.map((c) => ({
            sku_id: c.sku_id,
            quantity: c.quantity,
            unit_price: c.unit_price,
          })),
        }),
      });

      const json = await res.json() as { order_ref?: string; error?: string };

      if (!res.ok) {
        setErrorMsg(json.error ?? "Failed to complete sale.");
        return;
      }

      setSuccessRef(json.order_ref ?? "N/A");
      setCart([]);
      // Reload products to reflect updated stock
      void loadProducts();
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setCompleting(false);
    }
  }

  const BTN: React.CSSProperties = {
    fontFamily: "var(--font-inter)",
    fontSize: 12,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    border: "none",
    cursor: "pointer",
    padding: "10px 16px",
    borderRadius: 4,
  };

  return (
    <div>
      {/* Page heading */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 11,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--es-gold)",
            marginBottom: 8,
          }}
        >
          In-Store
        </p>
        <h1
          style={{
            fontFamily: "var(--font-bodoni)",
            fontSize: 36,
            fontWeight: 400,
            color: "var(--es-ink)",
            margin: 0,
          }}
        >
          POS Terminal
        </h1>
      </div>

      <div style={{ display: "flex", gap: 32, alignItems: "start" }}>
        {/* Left: Product browser */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px 16px",
              border: "1px solid var(--es-bone)",
              borderRadius: 6,
              fontFamily: "var(--font-inter)",
              fontSize: 14,
              color: "var(--es-ink)",
              background: "var(--es-white)",
              marginBottom: 20,
              boxSizing: "border-box",
              outline: "none",
            }}
          />

          {loading ? (
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                color: "var(--es-mute)",
                padding: "24px 0",
              }}
            >
              Loading products…
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 16,
                maxHeight: "calc(100vh - 320px)",
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {filtered.map((product) => (
                <div
                  key={product.id}
                  style={{
                    background: "var(--es-white)",
                    borderRadius: 6,
                    padding: "16px",
                    border: "1px solid var(--es-bone)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-bodoni)",
                      fontSize: 15,
                      color: "var(--es-ink)",
                      margin: "0 0 4px",
                      lineHeight: 1.3,
                    }}
                  >
                    {product.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: 12,
                      color: "var(--es-plum)",
                      margin: "0 0 12px",
                      fontWeight: 600,
                    }}
                  >
                    {formatKES(product.base_price)}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {product.skus
                      .filter((s) => s.stock_quantity > 0)
                      .map((sku) => (
                        <button
                          key={sku.id}
                          onClick={() => addToCart(product, sku)}
                          title={`${sku.size}${sku.color ? ` / ${sku.color}` : ""} — ${sku.stock_quantity} left`}
                          style={{
                            ...BTN,
                            background: "var(--es-plum-lt)",
                            color: "var(--es-plum)",
                            padding: "8px 12px",
                            fontSize: 11,
                            letterSpacing: "0.15em",
                          }}
                        >
                          {sku.size}
                          {sku.color ? ` / ${sku.color}` : ""}
                        </button>
                      ))}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && !loading && (
                <div
                  style={{
                    gridColumn: "1/-1",
                    padding: "40px",
                    textAlign: "center",
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    color: "var(--es-mute)",
                  }}
                >
                  No in-stock products found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div
          style={{
            width: 380,
            flexShrink: 0,
            background: "var(--es-white)",
            borderRadius: 8,
            padding: "28px 28px",
            border: "1px solid var(--es-bone)",
            position: "sticky",
            top: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "var(--es-mute)",
                margin: 0,
              }}
            >
              Cart ({cart.length})
            </p>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  color: "var(--es-mute)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Success message */}
          {successRef && (
            <div
              style={{
                background: "#e8f5e9",
                border: "1px solid #a5d6a7",
                borderRadius: 4,
                padding: "16px",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-bodoni)",
                  fontSize: 18,
                  color: "#2e7d32",
                  margin: "0 0 4px",
                }}
              >
                Sale Complete
              </p>
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 13,
                  color: "#2e7d32",
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                Order Ref: {successRef}
              </p>
              <button
                onClick={clearCart}
                style={{
                  marginTop: 12,
                  ...BTN,
                  background: "#2e7d32",
                  color: "#fff",
                  fontSize: 11,
                }}
              >
                New Sale
              </button>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div
              style={{
                background: "#fde8e8",
                border: "1px solid #f5c6cb",
                borderRadius: 4,
                padding: "12px 16px",
                marginBottom: 16,
                fontFamily: "var(--font-inter)",
                fontSize: 13,
                color: "#c0392b",
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Cart items */}
          {cart.length === 0 && !successRef ? (
            <div
              style={{
                padding: "40px 0",
                textAlign: "center",
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                color: "var(--es-mute)",
              }}
            >
              Select a product to add it to cart.
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                {cart.map((item) => (
                  <div
                    key={item.sku_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 0",
                      borderBottom: "1px solid var(--es-bone)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 13,
                          color: "var(--es-ink)",
                          margin: 0,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.product_name}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 11,
                          color: "var(--es-mute)",
                          margin: "2px 0 0",
                        }}
                      >
                        {item.size}{item.color ? ` / ${item.color}` : ""} · {formatKES(item.unit_price)}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={() => updateQty(item.sku_id, -1)}
                        style={{
                          width: 28,
                          height: 28,
                          border: "1px solid var(--es-bone)",
                          background: "none",
                          borderRadius: 3,
                          cursor: "pointer",
                          fontFamily: "var(--font-inter)",
                          fontSize: 16,
                          color: "var(--es-ink)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 14,
                          color: "var(--es-ink)",
                          width: 20,
                          textAlign: "center",
                          fontWeight: 600,
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.sku_id, 1)}
                        style={{
                          width: 28,
                          height: 28,
                          border: "1px solid var(--es-bone)",
                          background: "none",
                          borderRadius: 3,
                          cursor: "pointer",
                          fontFamily: "var(--font-inter)",
                          fontSize: 16,
                          color: "var(--es-ink)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >
                        +
                      </button>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--es-ink)",
                        width: 80,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {formatKES(item.unit_price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.sku_id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#c0392b",
                        fontSize: 16,
                        padding: "2px",
                        flexShrink: 0,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-bodoni)",
                  fontSize: 22,
                  color: "var(--es-ink)",
                  borderTop: "2px solid var(--es-ink)",
                  paddingTop: 16,
                  marginBottom: 24,
                }}
              >
                <span>Total</span>
                <span>{formatKES(subtotal)}</span>
              </div>

              {/* Payment */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "var(--es-mute)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Customer Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0700000000"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid var(--es-bone)",
                    borderRadius: 4,
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    color: "var(--es-ink)",
                    background: "var(--es-white)",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "var(--es-mute)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Payment Method
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["cash", "mpesa"] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        fontFamily: "var(--font-inter)",
                        fontSize: 11,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        border: `2px solid ${paymentMethod === method ? "var(--es-plum)" : "var(--es-bone)"}`,
                        background: paymentMethod === method ? "var(--es-plum-lt)" : "transparent",
                        color: paymentMethod === method ? "var(--es-plum)" : "var(--es-mute)",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: paymentMethod === method ? 600 : 400,
                      }}
                    >
                      {method === "cash" ? "Cash" : "M-Pesa"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => void completeSale()}
                disabled={completing || cart.length === 0}
                style={{
                  width: "100%",
                  padding: "16px 0",
                  background: completing || cart.length === 0
                    ? "var(--es-mute)"
                    : "var(--es-plum)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  cursor: completing || cart.length === 0 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                {completing ? "Processing…" : "Complete Sale"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
