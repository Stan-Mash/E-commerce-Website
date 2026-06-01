"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

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

type StatusFilter = "all" | "in-stock" | "low-stock" | "out-of-stock";
type AdjustMode = "delta" | "absolute";

const PAGE_SIZE = 30;

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function stockStatus(qty: number): { label: string; filter: StatusFilter; style: React.CSSProperties } {
  if (qty === 0) return { label: "Out of Stock", filter: "out-of-stock", style: { background: "#fde8e8", color: "#c0392b" } };
  if (qty < 5) return { label: "Low Stock", filter: "low-stock", style: { background: "#fff8e1", color: "#f57f17" } };
  return { label: "In Stock", filter: "in-stock", style: { background: "#e8f5e9", color: "#2e7d32" } };
}

interface AdjustState {
  skuId: string;
  value: string;
  reason: Reason;
  mode: AdjustMode;
}

const STATUS_FILTER_LABELS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in-stock", label: "In Stock" },
  { key: "low-stock", label: "Low Stock" },
  { key: "out-of-stock", label: "Out of Stock" },
];

export default function StockPage() {
  const [skus, setSkus] = useState<SkuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState<AdjustState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ id: string; msg: string } | null>(null);

  // Search & filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Pagination
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stock");
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
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

  // Summary stats (computed from all loaded data)
  const totalSkus = skus.length;
  const outOfStockCount = useMemo(() => skus.filter((s) => s.stock_quantity === 0).length, [skus]);
  const lowStockCount = useMemo(() => skus.filter((s) => s.stock_quantity > 0 && s.stock_quantity < 5).length, [skus]);
  const totalInventoryValue = useMemo(
    () => skus.reduce((sum, sku) => sum + sku.stock_quantity * (sku.products?.base_price ?? 0), 0),
    [skus]
  );

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return skus.filter((sku) => {
      if (q) {
        const nameMatch = sku.products?.name?.toLowerCase().includes(q) ?? false;
        const skuMatch = sku.sku_code.toLowerCase().includes(q);
        if (!nameMatch && !skuMatch) return false;
      }
      if (statusFilter !== "all") {
        const { filter } = stockStatus(sku.stock_quantity);
        if (filter !== statusFilter) return false;
      }
      return true;
    });
  }, [skus, search, statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function startAdjust(skuId: string) {
    setAdjusting({ skuId, value: "0", reason: "Restock", mode: "delta" });
    setSaveMsg(null);
  }

  function cancelAdjust() {
    setAdjusting(null);
  }

  async function saveAdjust() {
    if (!adjusting) return;
    const parsed = parseInt(adjusting.value, 10);
    if (isNaN(parsed)) return;
    if (adjusting.mode === "delta" && parsed === 0) return;
    if (adjusting.mode === "absolute" && parsed < 0) return;

    setSaving(true);
    try {
      const body =
        adjusting.mode === "delta"
          ? {
              sku_id: adjusting.skuId,
              delta: parsed,
              reason: adjusting.reason.toLowerCase(),
              mode: "delta",
            }
          : {
              sku_id: adjusting.skuId,
              quantity: parsed,
              reason: adjusting.reason.toLowerCase(),
              mode: "absolute",
            };

      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
          marginBottom: 32,
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

      {/* Out-of-stock warning banner */}
      {outOfStockCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#fde8e8",
            border: "1px solid #f5c6c6",
            borderLeft: "4px solid #c0392b",
            borderRadius: 4,
            padding: "12px 18px",
            marginBottom: 24,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c0392b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              color: "#c0392b",
              margin: 0,
            }}
          >
            <strong>{outOfStockCount} SKU{outOfStockCount !== 1 ? "s are" : " is"} out of stock</strong>
            {" "}— consider restocking.
          </p>
        </div>
      )}

      {/* Summary stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          { label: "Total SKUs", value: totalSkus, color: "var(--es-ink)" },
          { label: "Low Stock", value: lowStockCount, color: "#f57f17" },
          { label: "Out of Stock", value: outOfStockCount, color: "#c0392b" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: "var(--es-white)",
              padding: "18px 22px",
              borderTop: `3px solid ${color}`,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-bodoni)",
                fontSize: 28,
                fontWeight: 400,
                color,
                margin: "0 0 4px",
              }}
            >
              {value}
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
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div
        style={{
          position: "relative",
          marginBottom: 20,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--es-mute)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name or SKU code…"
          style={{
            width: "100%",
            boxSizing: "border-box",
            paddingLeft: 28,
            paddingRight: 12,
            paddingTop: 10,
            paddingBottom: 10,
            border: "none",
            borderBottom: "2px solid var(--es-bone)",
            background: "transparent",
            fontFamily: "var(--font-inter)",
            fontSize: 14,
            color: "var(--es-ink)",
            outline: "none",
          }}
          onFocus={(e) => { (e.currentTarget.style.borderBottomColor = "var(--es-plum)"); }}
          onBlur={(e) => { (e.currentTarget.style.borderBottomColor = "var(--es-bone)"); }}
        />
      </div>

      {/* Status filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {STATUS_FILTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid",
              borderColor: statusFilter === key ? "var(--es-plum)" : "var(--es-bone)",
              background: statusFilter === key ? "var(--es-plum)" : "transparent",
              color: statusFilter === key ? "#fff" : "var(--es-mute)",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s, border-color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
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
            ) : paginated.length === 0 ? (
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
                  {filtered.length === 0 && (search || statusFilter !== "all")
                    ? "No SKUs match your filters."
                    : "No SKUs found."}
                </td>
              </tr>
            ) : (
              paginated.map((sku, index) => {
                const { label, style: badgeStyle } = stockStatus(sku.stock_quantity);
                const isAdjusting = adjusting?.skuId === sku.id;
                const isEven = index % 2 === 0;

                return (
                  <React.Fragment key={sku.id}>
                    <tr style={{ background: isEven ? "var(--es-white)" : "var(--es-paper)" }}>
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
                      <tr key={`${sku.id}-adjust`} style={{ background: "#f5f0ff" }}>
                        <td colSpan={6} style={{ padding: "20px 20px" }}>
                          {/* Mode toggle */}
                          <div style={{ display: "flex", gap: 0, marginBottom: 16, width: "fit-content", border: "1px solid var(--es-plum)", borderRadius: 4, overflow: "hidden" }}>
                            {(["delta", "absolute"] as AdjustMode[]).map((m) => (
                              <button
                                key={m}
                                onClick={() =>
                                  setAdjusting((a) => a ? { ...a, mode: m, value: "0" } : null)
                                }
                                style={{
                                  fontFamily: "var(--font-inter)",
                                  fontSize: 10,
                                  letterSpacing: "0.2em",
                                  textTransform: "uppercase",
                                  padding: "6px 16px",
                                  border: "none",
                                  background: adjusting.mode === m ? "var(--es-plum)" : "transparent",
                                  color: adjusting.mode === m ? "#fff" : "var(--es-plum)",
                                  cursor: "pointer",
                                }}
                              >
                                {m === "delta" ? "+/− Delta" : "Set Exact"}
                              </button>
                            ))}
                          </div>

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
                                {adjusting.mode === "delta" ? "+/− Units" : "New Quantity"}
                              </label>
                              <input
                                type="number"
                                value={adjusting.value}
                                min={adjusting.mode === "absolute" ? 0 : undefined}
                                onChange={(e) =>
                                  setAdjusting((a) =>
                                    a ? { ...a, value: e.target.value } : null
                                  )
                                }
                                style={{
                                  width: 110,
                                  padding: "8px 12px",
                                  border: "1px solid var(--es-bone)",
                                  borderRadius: 4,
                                  fontFamily: "var(--font-inter)",
                                  fontSize: 14,
                                  color: "var(--es-ink)",
                                  background: "#fff",
                                }}
                                placeholder={adjusting.mode === "delta" ? "+10 or −5" : "e.g. 25"}
                              />
                              {adjusting.mode === "absolute" && (
                                <p
                                  style={{
                                    fontFamily: "var(--font-inter)",
                                    fontSize: 11,
                                    color: "var(--es-mute)",
                                    margin: "4px 0 0",
                                  }}
                                >
                                  Current: {sku.stock_quantity} units
                                </p>
                              )}
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
                                color:
                                  saveMsg.msg.includes("Failed") || saveMsg.msg.includes("error")
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

      {/* Pagination */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 12,
              color: "var(--es-mute)",
              margin: 0,
            }}
          >
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} SKUs
          </p>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "7px 16px",
                border: "1px solid var(--es-bone)",
                borderRadius: 3,
                background: "var(--es-white)",
                color: page === 1 ? "var(--es-bone)" : "var(--es-ink)",
                cursor: page === 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Prev
            </button>

            <span
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 12,
                color: "var(--es-mute)",
                padding: "0 4px",
              }}
            >
              Page {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "7px 16px",
                border: "1px solid var(--es-bone)",
                borderRadius: 3,
                background: "var(--es-white)",
                color: page === totalPages ? "var(--es-bone)" : "var(--es-ink)",
                cursor: page === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
