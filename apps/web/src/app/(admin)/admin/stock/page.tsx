"use client";

import React, { useState, useEffect, useCallback } from "react";

interface SkuRow {
  id: string;
  sku_code: string;
  size: string;
  color: string | null;
  stock_quantity: number;
  products: {
    id: string;
    name: string;
    base_price: number;
  } | null;
}

const REASONS = ["Restock", "Damaged", "Lost", "Return", "Adjustment"] as const;
type Reason = typeof REASONS[number];

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function stockStatus(qty: number): { label: string; style: React.CSSProperties } {
  if (qty === 0) return { label: "Out", style: { background: "#fde8e8", color: "#c0392b" } };
  if (qty < 5) return { label: "Low", style: { background: "#fff8e1", color: "#f57f17" } };
  return { label: "In Stock", style: { background: "#e8f5e9", color: "#2e7d32" } };
}

interface AdjustState {
  skuId: string;
  delta: string;
  reason: Reason;
}

export default function StockPage() {
  const [skus, setSkus] = useState<SkuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState<AdjustState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ id: string; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stock");
      if (res.ok) {
        const json = await res.json() as { skus: SkuRow[] };
        setSkus(json.skus ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalInventoryValue = skus.reduce((sum, sku) => {
    return sum + sku.stock_quantity * (sku.products?.base_price ?? 0);
  }, 0);

  function startAdjust(skuId: string) {
    setAdjusting({ skuId, delta: "0", reason: "Restock" });
    setSaveMsg(null);
  }

  function cancelAdjust() {
    setAdjusting(null);
  }

  async function saveAdjust() {
    if (!adjusting) return;
    const delta = parseInt(adjusting.delta, 10);
    if (isNaN(delta) || delta === 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku_id: adjusting.skuId,
          delta,
          reason: adjusting.reason.toLowerCase(),
        }),
      });
      const json = await res.json() as { new_quantity?: number; error?: string };

      if (res.ok && json.new_quantity !== undefined) {
        setSkus((prev) =>
          prev.map((s) =>
            s.id === adjusting.skuId
              ? { ...s, stock_quantity: json.new_quantity! }
              : s
          )
        );
        setSaveMsg({ id: adjusting.skuId, msg: `Updated to ${json.new_quantity} units.` });
        setAdjusting(null);
      } else {
        setSaveMsg({ id: adjusting.skuId, msg: json.error ?? "Failed." });
      }
    } catch {
      setSaveMsg({ id: adjusting.skuId, msg: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 40,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
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
            Inventory
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
            Stock Management
          </h1>
        </div>
        <div
          style={{
            background: "var(--es-white)",
            padding: "16px 24px",
            borderTop: "3px solid var(--es-gold)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: 24,
              color: "var(--es-gold)",
              margin: "0 0 4px",
              fontWeight: 400,
            }}
          >
            {formatKES(totalInventoryValue)}
          </p>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--es-mute)",
              margin: 0,
            }}
          >
            Total Inventory Value
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-inter)" }}>
          <thead>
            <tr style={{ background: "var(--es-ink)" }}>
              {["Product", "SKU Code", "Size / Colour", "Stock", "Status", "Action"].map(
                (col, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "14px 20px",
                      textAlign: i >= 3 ? "right" : "left",
                      fontFamily: "var(--font-inter)",
                      fontSize: 11,
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      color: "var(--es-white)",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    background: "var(--es-white)",
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    color: "var(--es-mute)",
                  }}
                >
                  Loading…
                </td>
              </tr>
            ) : skus.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    background: "var(--es-white)",
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    color: "var(--es-mute)",
                  }}
                >
                  No SKUs found.
                </td>
              </tr>
            ) : (
              skus.map((sku, index) => {
                const { label, style: badgeStyle } = stockStatus(sku.stock_quantity);
                const isAdjusting = adjusting?.skuId === sku.id;
                const isEven = index % 2 === 0;

                return (
                  <React.Fragment key={sku.id}>
                    <tr
                      style={{ background: isEven ? "var(--es-white)" : "var(--es-paper)" }}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-bodoni)",
                            fontSize: 15,
                            color: "var(--es-ink)",
                          }}
                        >
                          {sku.products?.name ?? "—"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 12,
                            color: "var(--es-mute)",
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          {sku.sku_code}
                        </span>
                      </td>

                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 13,
                            color: "var(--es-ink)",
                          }}
                        >
                          {sku.size}{sku.color ? ` / ${sku.color}` : ""}
                        </span>
                      </td>

                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: 16,
                            fontWeight: 600,
                            color:
                              sku.stock_quantity === 0
                                ? "#c0392b"
                                : sku.stock_quantity < 5
                                ? "#f57f17"
                                : "var(--es-ink)",
                          }}
                        >
                          {sku.stock_quantity}
                        </span>
                      </td>

                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <span
                          style={{
                            display: "inline-block",
                            fontFamily: "var(--font-inter)",
                            fontSize: 10,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            padding: "4px 10px",
                            borderRadius: 2,
                            whiteSpace: "nowrap",
                            ...badgeStyle,
                          }}
                        >
                          {label}
                        </span>
                      </td>

                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        {isAdjusting ? (
                          <button
                            onClick={cancelAdjust}
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: 11,
                              color: "var(--es-mute)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => startAdjust(sku.id)}
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: 12,
                              letterSpacing: "0.15em",
                              textTransform: "uppercase",
                              color: "var(--es-plum)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            Adjust
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Inline adjustment form */}
                    {isAdjusting && adjusting && (
                      <tr
                        key={`${sku.id}-adjust`}
                        style={{ background: "#f5f0ff" }}
                      >
                        <td colSpan={6} style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
                            <div>
                              <label
                                style={{
                                  fontFamily: "var(--font-inter)",
                                  fontSize: 10,
                                  letterSpacing: "0.25em",
                                  textTransform: "uppercase",
                                  color: "var(--es-mute)",
                                  display: "block",
                                  marginBottom: 6,
                                }}
                              >
                                Delta (+/−)
                              </label>
                              <input
                                type="number"
                                value={adjusting.delta}
                                onChange={(e) =>
                                  setAdjusting((a) =>
                                    a ? { ...a, delta: e.target.value } : null
                                  )
                                }
                                style={{
                                  width: 100,
                                  padding: "8px 12px",
                                  border: "1px solid var(--es-bone)",
                                  borderRadius: 4,
                                  fontFamily: "var(--font-inter)",
                                  fontSize: 14,
                                  color: "var(--es-ink)",
                                  background: "#fff",
                                }}
                                placeholder="+10 or -5"
                              />
                            </div>
                            <div>
                              <label
                                style={{
                                  fontFamily: "var(--font-inter)",
                                  fontSize: 10,
                                  letterSpacing: "0.25em",
                                  textTransform: "uppercase",
                                  color: "var(--es-mute)",
                                  display: "block",
                                  marginBottom: 6,
                                }}
                              >
                                Reason
                              </label>
                              <select
                                value={adjusting.reason}
                                onChange={(e) =>
                                  setAdjusting((a) =>
                                    a ? { ...a, reason: e.target.value as Reason } : null
                                  )
                                }
                                style={{
                                  padding: "8px 12px",
                                  border: "1px solid var(--es-bone)",
                                  borderRadius: 4,
                                  fontFamily: "var(--font-inter)",
                                  fontSize: 14,
                                  color: "var(--es-ink)",
                                  background: "#fff",
                                  cursor: "pointer",
                                }}
                              >
                                {REASONS.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => void saveAdjust()}
                              disabled={saving}
                              style={{
                                padding: "9px 20px",
                                background: "var(--es-plum)",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                fontFamily: "var(--font-inter)",
                                fontSize: 11,
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                cursor: saving ? "not-allowed" : "pointer",
                                opacity: saving ? 0.7 : 1,
                              }}
                            >
                              {saving ? "Saving…" : "Apply"}
                            </button>
                          </div>
                          {saveMsg?.id === sku.id && (
                            <p
                              style={{
                                fontFamily: "var(--font-inter)",
                                fontSize: 12,
                                color: saveMsg.msg.includes("Failed") || saveMsg.msg.includes("error")
                                  ? "#c0392b"
                                  : "#2e7d32",
                                margin: "8px 0 0",
                              }}
                            >
                              {saveMsg.msg}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
