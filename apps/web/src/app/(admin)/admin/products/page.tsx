"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

interface SKURow {
  id: string;
  sku_code: string;
  size: string;
  color: string | null;
  stock_quantity: number;
}

interface ProductRow {
  id: string;
  name: string;
  category: string;
  base_price: number;
  status: "active" | "draft" | "archived";
  image_url: string | null;
  skus: SKURow[];
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  active:   { background: "#e8f5e9", color: "#2e7d32" },
  draft:    { background: "#fff8e1", color: "#f57f17" },
  archived: { background: "#fafafa", color: "#757575" },
};

const PAGE_SIZE = 20;

function ProductThumbnail({ imageUrl }: { imageUrl: string | null }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 2, display: "block" }}
      />
    );
  }
  return (
    <div
      style={{
        width: 48,
        height: 48,
        background: "#e0e0e0",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9e9e9e"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "archived" | "coming_soon">("all");
  const [page, setPage] = useState(1);

  // Bulk select state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("active");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (res.ok) {
        const json = await res.json() as { products: ProductRow[] };
        setProducts(json.products ?? []);
      }
    } catch {
      // ignore - show empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        q === "" ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const pageIds = useMemo(
    () => new Set(filtered.slice((Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))) - 1) * PAGE_SIZE, Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))) * PAGE_SIZE).map((p) => p.id)),
    [filtered, page]
  );
  const allPageSelected = pageIds.size > 0 && [...pageIds].every((id) => selected.has(id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelected((prev) => { const next = new Set(prev); pageIds.forEach((id) => next.delete(id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); pageIds.forEach((id) => next.add(id)); return next; });
    }
  }

  async function applyBulkStatus() {
    if (selected.size === 0) return;
    setBulkSaving(true);
    setBulkMsg(null);
    try {
      const ids = [...selected];
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/products/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: bulkStatus }),
          })
        )
      );
      const ok = results.filter((r) => r.ok).length;
      setProducts((prev) => prev.map((p) => selected.has(p.id) ? { ...p, status: bulkStatus as ProductRow["status"] } : p));
      setSelected(new Set());
      setBulkMsg(`Updated ${ok} product${ok !== 1 ? "s" : ""}.`);
      setTimeout(() => setBulkMsg(null), 3000);
    } catch {
      setBulkMsg("Failed to update.");
    } finally {
      setBulkSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function confirmDelete(id: string) {
    setDeleteId(id);
  }
  function cancelDelete() {
    setDeleteId(null);
  }

  async function executeDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const productToDelete = products.find((p) => p.id === deleteId);

  const colHeaders = ["", "", "Name", "Category", "Price", "SKUs / Stock", "Status", ""];

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 32,
          gap: 16,
          flexWrap: "wrap",
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
            Catalogue
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
            Products
          </h1>
        </div>
        <Link href="/admin/products/new" className="es-btn-plum" style={{ flexShrink: 0 }}>
          + Add Product
        </Link>
      </div>

      {/* Search + Status filter */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          flexWrap: "wrap",
          alignItems: "stretch",
        }}
      >
        {/* Search bar */}
        <div
          style={{
            flex: 1,
            minWidth: 220,
            display: "flex",
            alignItems: "center",
            borderBottom: "2px solid var(--es-ink)",
            paddingBottom: 6,
            gap: 8,
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
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-inter)",
              fontSize: 14,
              color: "var(--es-ink)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "var(--es-mute)",
                fontSize: 16,
                lineHeight: 1,
                flexShrink: 0,
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--es-ink)",
            background: "var(--es-white)",
            border: "1px solid var(--es-bone)",
            borderRadius: 4,
            padding: "8px 32px 8px 14px",
            cursor: "pointer",
            appearance: "none",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            minWidth: 140,
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="coming_soon">Coming Soon</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 16px", background: "var(--es-ink)", borderRadius: 6, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#fff", marginRight: 8 }}>
            {selected.size} selected
          </span>
          <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.2em" }}>Change status to</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid #444", background: "#222", color: "#fff", fontFamily: "var(--font-inter)", fontSize: 13, cursor: "pointer" }}
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => void applyBulkStatus()}
            disabled={bulkSaving}
            style={{ padding: "7px 20px", background: "var(--es-gold)", color: "#000", border: "none", borderRadius: 4, fontFamily: "var(--font-inter)", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", cursor: bulkSaving ? "not-allowed" : "pointer", opacity: bulkSaving ? 0.6 : 1 }}
          >
            {bulkSaving ? "Applying…" : "Apply"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-inter)" }}
          >
            Clear
          </button>
          {bulkMsg && <span style={{ fontSize: 13, color: "#90ee90" }}>{bulkMsg}</span>}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-inter)",
          }}
        >
          <thead>
            <tr style={{ background: "var(--es-ink)" }}>
              {/* Checkbox header */}
              <th style={{ padding: "14px 8px 14px 16px", width: 36 }}>
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAll}
                  style={{ cursor: "pointer", accentColor: "var(--es-gold)", width: 15, height: 15 }}
                />
              </th>
              {colHeaders.map((col, i) => (
                <th
                  key={i}
                  style={{
                    padding: i === 0 ? "14px 12px 14px 8px" : "14px 20px",
                    textAlign: i === colHeaders.length - 1 ? "right" : "left",
                    fontFamily: "var(--font-inter)",
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "var(--es-white)",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    width: i === 0 ? 60 : undefined,
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
                <td
                  colSpan={colHeaders.length}
                  style={{
                    padding: "48px 20px",
                    textAlign: "center",
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    color: "var(--es-mute)",
                    background: "var(--es-white)",
                  }}
                >
                  Loading products…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={colHeaders.length}
                  style={{
                    padding: "64px 20px",
                    textAlign: "center",
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    color: "var(--es-mute)",
                    background: "var(--es-white)",
                  }}
                >
                  {products.length === 0 ? (
                    <>
                      No products yet.{" "}
                      <Link href="/admin/products/new" style={{ color: "var(--es-plum)" }}>
                        Add the first one →
                      </Link>
                    </>
                  ) : (
                    "No products match your search."
                  )}
                </td>
              </tr>
            ) : (
              pageItems.map((product, index) => {
                const isEven = index % 2 === 0;
                const statusStyle = STATUS_STYLES[product.status] ?? STATUS_STYLES["draft"]!;
                const totalStock = product.skus.reduce((s, sku) => s + sku.stock_quantity, 0);

                return (
                  <tr
                    key={product.id}
                    style={{
                      background: selected.has(product.id) ? "rgba(201,169,97,0.08)" : isEven ? "var(--es-white)" : "var(--es-paper)",
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: "12px 8px 12px 16px", width: 36 }}>
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        style={{ cursor: "pointer", accentColor: "var(--es-gold)", width: 15, height: 15 }}
                      />
                    </td>
                    {/* Thumbnail */}
                    <td style={{ padding: "12px 8px 12px 0", width: 60 }}>
                      <ProductThumbnail imageUrl={product.image_url} />
                    </td>

                    {/* Name */}
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-bodoni)",
                          fontSize: 16,
                          fontWeight: 400,
                          color: "var(--es-ink)",
                        }}
                      >
                        {product.name}
                      </span>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          fontFamily: "var(--font-inter)",
                          fontSize: 10,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: "var(--es-plum)",
                          background: "var(--es-plum-lt)",
                          padding: "4px 10px",
                          borderRadius: 2,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {product.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 14,
                          color: "var(--es-ink)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatKES(product.base_price)}
                      </span>
                    </td>

                    {/* SKUs / Stock */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {product.skus.length > 0 ? (
                          product.skus.slice(0, 3).map((sku) => (
                            <span
                              key={sku.id}
                              style={{
                                fontFamily: "var(--font-inter)",
                                fontSize: 11,
                                color:
                                  sku.stock_quantity === 0
                                    ? "#c0392b"
                                    : sku.stock_quantity < 5
                                    ? "#f57f17"
                                    : "var(--es-mute)",
                              }}
                            >
                              {sku.size}
                              {sku.color ? ` / ${sku.color}` : ""} — {sku.stock_quantity} units
                            </span>
                          ))
                        ) : (
                          <span
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: 11,
                              color: "var(--es-mute)",
                            }}
                          >
                            No SKUs
                          </span>
                        )}
                        {product.skus.length > 3 && (
                          <span
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: 11,
                              color: "var(--es-mute)",
                            }}
                          >
                            +{product.skus.length - 3} more · {totalStock} total
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          fontFamily: "var(--font-inter)",
                          fontSize: 10,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: 2,
                          background: statusStyle.background,
                          color: statusStyle.color,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {product.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td
                      style={{
                        padding: "16px 20px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 12,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "var(--es-plum)",
                          textDecoration: "none",
                          marginRight: 20,
                        }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => confirmDelete(product.id)}
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: 12,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "#c0392b",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
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
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 12,
              color: "var(--es-mute)",
              letterSpacing: "0.05em",
            }}
          >
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
            {search || statusFilter !== "all" ? " found" : " total"}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 12,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: safePage <= 1 ? "var(--es-mute)" : "var(--es-ink)",
                background: "none",
                border: "1px solid var(--es-bone)",
                borderRadius: 4,
                padding: "7px 16px",
                cursor: safePage <= 1 ? "not-allowed" : "pointer",
                opacity: safePage <= 1 ? 0.5 : 1,
              }}
            >
              Prev
            </button>

            <span
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 12,
                color: "var(--es-ink)",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}
            >
              Page {safePage} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 12,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: safePage >= totalPages ? "var(--es-mute)" : "var(--es-ink)",
                background: "none",
                border: "1px solid var(--es-bone)",
                borderRadius: 4,
                padding: "7px 16px",
                cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                opacity: safePage >= totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && productToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "var(--es-white)",
              borderRadius: 8,
              padding: "40px 36px",
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-bodoni)",
                fontSize: 24,
                fontWeight: 400,
                color: "var(--es-ink)",
                margin: "0 0 12px",
              }}
            >
              Delete Product
            </h2>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                color: "var(--es-mute)",
                lineHeight: 1.6,
                margin: "0 0 32px",
              }}
            >
              Are you sure you want to delete{" "}
              <strong style={{ color: "var(--es-ink)" }}>{productToDelete.name}</strong>? This
              action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => void executeDelete()}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  background: "#c0392b",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={cancelDelete}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  background: "transparent",
                  color: "var(--es-ink)",
                  border: "1px solid var(--es-bone)",
                  borderRadius: 4,
                  fontFamily: "var(--font-inter)",
                  fontSize: 12,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
