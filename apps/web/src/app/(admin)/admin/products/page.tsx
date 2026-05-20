"use client";

import { useState } from "react";
import Link from "next/link";

interface SeedProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  sizes: string[];
  status: "active" | "draft" | "archived";
}

const INITIAL_PRODUCTS: SeedProduct[] = [
  { id: "1", name: "Kikoy Wrap Dress",        category: "Woman",    price: 8500,  sizes: ["S", "M", "L"],              status: "active" },
  { id: "2", name: "Maasai Bead Collar Shirt", category: "Man",      price: 6200,  sizes: ["S", "M", "L"],              status: "active" },
  { id: "3", name: "Ankara Print Jumpsuit",   category: "Children", price: 4800,  sizes: ["2Y", "4Y", "6Y"],           status: "active" },
  { id: "4", name: "Nairobi Linen Co-ord",    category: "Woman",    price: 12400, sizes: ["S", "M"],                   status: "active" },
  { id: "5", name: "Kitenge Baraza Shirt",    category: "Man",      price: 5800,  sizes: ["M", "L"],                   status: "active" },
  { id: "6", name: "Shuka Check Romper",      category: "Children", price: 3200,  sizes: ["2Y", "4Y"],                 status: "draft"  },
];

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_STYLES: Record<SeedProduct["status"], { background: string; color: string }> = {
  active:   { background: "#e8f5e9", color: "#2e7d32" },
  draft:    { background: "#fff8e1", color: "#f57f17" },
  archived: { background: "#fafafa", color: "#757575" },
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<SeedProduct[]>(INITIAL_PRODUCTS);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function confirmDelete(id: string) {
    setDeleteId(id);
  }
  function cancelDelete() {
    setDeleteId(null);
  }
  function executeDelete() {
    setProducts((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
  }

  const productToDelete = products.find((p) => p.id === deleteId);

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 40,
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
              {["Name", "Category", "Price", "Sizes", "Status", ""].map((col, i) => (
                <th
                  key={i}
                  style={{
                    padding: "14px 20px",
                    textAlign: i === 5 ? "right" : "left",
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
              ))}
            </tr>
          </thead>

          <tbody>
            {products.map((product, index) => {
              const isEven = index % 2 === 0;
              const statusStyle = STATUS_STYLES[product.status];

              return (
                <tr
                  key={product.id}
                  style={{
                    background: isEven ? "var(--es-white)" : "var(--es-paper)",
                  }}
                >
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
                      {formatKES(product.price)}
                    </span>
                  </td>

                  {/* Sizes */}
                  <td style={{ padding: "16px 20px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: 12,
                        color: "var(--es-mute)",
                      }}
                    >
                      {product.sizes.join(", ")}
                    </span>
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
                  <td style={{ padding: "16px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
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
            })}

            {products.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "64px 20px",
                    textAlign: "center",
                    fontFamily: "var(--font-inter)",
                    fontSize: 14,
                    color: "var(--es-mute)",
                  }}
                >
                  No products yet.{" "}
                  <Link href="/admin/products/new" style={{ color: "var(--es-plum)" }}>
                    Add the first one →
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                onClick={executeDelete}
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
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Delete
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
