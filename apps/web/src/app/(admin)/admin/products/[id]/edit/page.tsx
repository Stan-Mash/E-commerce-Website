"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  params: { id: string };
}

// Seed data matching the admin products list
const SEED_PRODUCTS = [
  { id: "1", name: "Nairobi Wrap Dress",     slug: "kikoy-wrap-dress",          category: "Woman",    base_price: 8500,  compare_price: 11000, material: "100% Cotton Kikoy",      status: "active", description: "Hand-loomed kikoy fabric wrap dress in vibrant coastal Kenya stripe patterns. Lightweight and breathable — perfect for Nairobi days and Mombasa evenings." },
  { id: "2", name: "Maasai Bead Collar Shirt",slug: "maasai-bead-collar-shirt", category: "Man",      base_price: 6200,  compare_price: null,  material: "100% Oxford Cotton",      status: "active", description: "Oxford cotton shirt with a hand-beaded Maasai collar — a conversation piece that bridges tradition and contemporary dressing." },
  { id: "3", name: "Ankara Print Jumpsuit",  slug: "ankara-print-kids-jumpsuit",category: "Children", base_price: 4800,  compare_price: null,  material: "100% Wax-Print Cotton",  status: "active", description: "Bold wax-print cotton jumpsuit with snap-leg fastening for easy dressing. Grows with your child." },
  { id: "4", name: "Nairobi Linen Co-ord",   slug: "nairobi-linen-co-ord",      category: "Woman",    base_price: 12400, compare_price: null,  material: "100% Belgian Linen",      status: "active", description: "Stonewashed Belgian linen two-piece in a relaxed tailored cut. The kind of outfit that looks better the more you wear it." },
  { id: "5", name: "Kitenge Baraza Shirt",   slug: "kitenge-baraza-shirt",       category: "Man",      base_price: 5800,  compare_price: null,  material: "100% Kitenge Wax Cotton", status: "active", description: "Relaxed open-hem shirt in traditional kitenge wax cotton. Designed for the baraza — the porch, the gathering, the moment of rest." },
  { id: "6", name: "Shuka Check Romper",     slug: "shuka-check-romper",         category: "Children", base_price: 3200,  compare_price: null,  material: "95% Cotton, 5% Elastane", status: "active", description: "Stretch cotton romper in the bold check pattern of the Maasai shuka. A growing hem means it lasts two seasons." },
];

export default function EditProductPage({ params }: Props) {
  const router = useRouter();
  const seed = SEED_PRODUCTS.find((p) => p.id === params.id);

  const [form, setForm] = useState({
    name:          seed?.name          ?? "",
    slug:          seed?.slug          ?? "",
    category:      seed?.category      ?? "Woman",
    description:   seed?.description   ?? "",
    base_price:    seed?.base_price    ?? 0,
    compare_price: seed?.compare_price ?? "",
    material:      seed?.material      ?? "",
    status:        seed?.status        ?? "active",
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  function set(key: string, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Simulate save — replace with real API call when Supabase is connected
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
  }

  const inputStyle: React.CSSProperties = {
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
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-inter)",
    fontSize: 11,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "var(--es-mute)",
    marginBottom: 8,
  };

  if (!seed) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ fontFamily: "var(--font-inter)", color: "var(--es-mute)" }}>
          Product not found.
        </p>
        <Link href="/admin/products" style={{ color: "var(--es-plum)", fontFamily: "var(--font-inter)", fontSize: 13 }}>
          ← Back to products
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <Link
          href="/admin/products"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--es-mute)",
            textDecoration: "none",
          }}
        >
          ← Products
        </Link>
        <h1
          style={{
            fontFamily: "var(--font-bodoni)",
            fontSize: 32,
            fontWeight: 400,
            color: "var(--es-ink)",
            margin: "12px 0 0",
          }}
        >
          Edit Product
        </h1>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Name + Slug */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={labelStyle}>Product Name</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  set("slug", autoSlug(e.target.value));
                }}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Slug</label>
              <input
                style={inputStyle}
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Category + Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                style={inputStyle}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                <option>Woman</option>
                <option>Man</option>
                <option>Children</option>
                <option>Accessories</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, height: 120, resize: "vertical" }}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* Prices */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={labelStyle}>Price (KES)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.base_price}
                onChange={(e) => set("base_price", Number(e.target.value))}
                min={0}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Compare Price (KES)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.compare_price ?? ""}
                onChange={(e) => set("compare_price", e.target.value ? Number(e.target.value) : "")}
                min={0}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Material */}
          <div>
            <label style={labelStyle}>Material</label>
            <input
              style={inputStyle}
              value={form.material}
              onChange={(e) => set("material", e.target.value)}
              placeholder="e.g. 100% Belgian Linen"
            />
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              paddingTop: 8,
              borderTop: "1px solid var(--es-bone)",
            }}
          >
            <button
              type="submit"
              disabled={saving}
              className="es-btn-plum"
              style={{ opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>

            {saved && (
              <span
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 13,
                  color: "#2e7d32",
                  letterSpacing: "0.05em",
                }}
              >
                ✓ Saved
              </span>
            )}

            <Link
              href="/admin/products"
              style={{
                marginLeft: "auto",
                fontFamily: "var(--font-inter)",
                fontSize: 12,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--es-mute)",
                textDecoration: "none",
              }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
