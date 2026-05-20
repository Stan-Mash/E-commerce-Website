"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INPUT_STYLE: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px 14px",
  border: "1px solid var(--es-bone)",
  borderRadius: 4,
  background: "var(--es-white)",
  fontFamily: "var(--font-inter)",
  fontSize: 14,
  color: "var(--es-ink)",
  outline: "none",
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-inter)",
  fontSize: 11,
  letterSpacing: "0.35em",
  textTransform: "uppercase",
  color: "var(--es-mute)",
  marginBottom: 6,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface SkuForm {
  sku_code: string;
  size: string;
  color: string;
  color_hex: string;
  stock_quantity: string;
}

interface FormState {
  name: string;
  slug: string;
  category: string;
  description: string;
  basePrice: string;
  comparePrice: string;
  material: string;
  care_instructions: string;
  status: string;
  is_featured: boolean;
}

const INITIAL_FORM: FormState = {
  name: "",
  slug: "",
  category: "Woman",
  description: "",
  basePrice: "",
  comparePrice: "",
  material: "",
  care_instructions: "",
  status: "draft",
  is_featured: false,
};

const BLANK_SKU: SkuForm = {
  sku_code: "",
  size: "",
  color: "",
  color_hex: "#000000",
  stock_quantity: "0",
};

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [skus, setSkus] = useState<SkuForm[]>([{ ...BLANK_SKU }]);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((prev) => ({ ...prev, name, slug: slugify(name) }));
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    },
    []
  );

  const handleFeaturedToggle = useCallback(() => {
    setForm((prev) => ({ ...prev, is_featured: !prev.is_featured }));
  }, []);

  function addSku() {
    setSkus((prev) => [...prev, { ...BLANK_SKU }]);
  }

  function removeSku(index: number) {
    setSkus((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSku(index: number, field: keyof SkuForm, value: string) {
    setSkus((prev) =>
      prev.map((sku, i) => (i === index ? { ...sku, [field]: value } : sku))
    );
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs["name"] = "Name is required.";
    if (!form.slug.trim()) errs["slug"] = "Slug is required.";
    if (!form.basePrice || isNaN(Number(form.basePrice))) {
      errs["basePrice"] = "Valid base price is required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        category: form.category,
        base_price: Number(form.basePrice),
        compare_price: form.comparePrice ? Number(form.comparePrice) : null,
        material: form.material || null,
        care_instructions: form.care_instructions || null,
        is_featured: form.is_featured,
        status: form.status,
        skus: skus
          .filter((s) => s.sku_code.trim() && s.size.trim())
          .map((s) => ({
            sku_code: s.sku_code,
            size: s.size,
            color: s.color || null,
            color_hex: s.color_hex || null,
            stock_quantity: Number(s.stock_quantity),
          })),
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json() as { error?: string };

      if (!res.ok) {
        setApiError(json.error ?? "Failed to save product.");
        return;
      }

      router.push("/admin/products");
    } catch (err) {
      setApiError("Network error. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 24,
          marginBottom: 48,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/admin/products"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--es-mute)",
            textDecoration: "none",
            paddingBottom: 2,
            borderBottom: "1px solid currentColor",
            flexShrink: 0,
            alignSelf: "center",
          }}
        >
          ← Products
        </Link>
        <div>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 11,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "var(--es-gold)",
              marginBottom: 6,
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
            Add Product
          </h1>
        </div>
      </div>

      {apiError && (
        <div
          style={{
            background: "#fde8e8",
            border: "1px solid #f5c6cb",
            borderRadius: 4,
            padding: "12px 16px",
            marginBottom: 24,
            fontFamily: "var(--font-inter)",
            fontSize: 14,
            color: "#c0392b",
          }}
        >
          {apiError}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} noValidate style={{ maxWidth: 760 }}>
        {/* Name + Slug */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
          <div>
            <label htmlFor="name" style={LABEL_STYLE}>Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleNameChange}
              style={INPUT_STYLE}
              placeholder="e.g. Nairobi Wrap Dress"
            />
            {errors["name"] && (
              <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>{errors["name"]}</p>
            )}
          </div>
          <div>
            <label htmlFor="slug" style={LABEL_STYLE}>Slug</label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              value={form.slug}
              onChange={handleChange}
              style={INPUT_STYLE}
              placeholder="nairobi-wrap-dress"
            />
            {errors["slug"] && (
              <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>{errors["slug"]}</p>
            )}
          </div>
        </div>

        {/* Category + Status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
          <div>
            <label htmlFor="category" style={LABEL_STYLE}>Category</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              style={{ ...INPUT_STYLE, cursor: "pointer" }}
            >
              <option value="Woman">Woman</option>
              <option value="Man">Man</option>
              <option value="Children">Children</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" style={LABEL_STYLE}>Status</label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              style={{ ...INPUT_STYLE, cursor: "pointer" }}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 28 }}>
          <label htmlFor="description" style={LABEL_STYLE}>Description</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            style={{ ...INPUT_STYLE, resize: "vertical" }}
            placeholder="Describe the product…"
          />
        </div>

        {/* Prices */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
          <div>
            <label htmlFor="basePrice" style={LABEL_STYLE}>Base Price KES</label>
            <input
              id="basePrice"
              name="basePrice"
              type="number"
              min={0}
              required
              value={form.basePrice}
              onChange={handleChange}
              style={INPUT_STYLE}
              placeholder="8500"
            />
            {errors["basePrice"] && (
              <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>{errors["basePrice"]}</p>
            )}
          </div>
          <div>
            <label htmlFor="comparePrice" style={LABEL_STYLE}>
              Compare Price KES
              <span style={{ marginLeft: 6, fontSize: 10, color: "#aaa", textTransform: "none", letterSpacing: 0 }}>
                (optional)
              </span>
            </label>
            <input
              id="comparePrice"
              name="comparePrice"
              type="number"
              min={0}
              value={form.comparePrice}
              onChange={handleChange}
              style={INPUT_STYLE}
              placeholder="10000"
            />
          </div>
        </div>

        {/* Material + Care */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
          <div>
            <label htmlFor="material" style={LABEL_STYLE}>Material</label>
            <input
              id="material"
              name="material"
              type="text"
              value={form.material}
              onChange={handleChange}
              style={INPUT_STYLE}
              placeholder="e.g. 100% Kenyan cotton"
            />
          </div>
          <div>
            <label htmlFor="care_instructions" style={LABEL_STYLE}>Care Instructions</label>
            <input
              id="care_instructions"
              name="care_instructions"
              type="text"
              value={form.care_instructions}
              onChange={handleChange}
              style={INPUT_STYLE}
              placeholder="e.g. Hand wash cold"
            />
          </div>
        </div>

        {/* Is featured toggle */}
        <div style={{ marginBottom: 40 }}>
          <label style={{ ...LABEL_STYLE, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div
              onClick={handleFeaturedToggle}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: form.is_featured ? "var(--es-plum)" : "var(--es-bone)",
                position: "relative",
                cursor: "pointer",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: 3,
                  left: form.is_featured ? 23 : 3,
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </div>
            <span>Featured Product</span>
          </label>
        </div>

        {/* SKUs */}
        <div
          style={{
            borderTop: "1px solid var(--es-bone)",
            paddingTop: 32,
            marginBottom: 40,
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
              SKUs (Size / Colour / Stock)
            </p>
            <button
              type="button"
              onClick={addSku}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--es-plum)",
                background: "none",
                border: "1px solid var(--es-plum)",
                padding: "6px 16px",
                cursor: "pointer",
                borderRadius: 2,
              }}
            >
              + Add SKU
            </button>
          </div>

          {skus.map((sku, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 80px 80px 40px",
                gap: 12,
                marginBottom: 12,
                alignItems: "start",
              }}
            >
              <div>
                {index === 0 && <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>SKU Code</label>}
                <input
                  type="text"
                  value={sku.sku_code}
                  onChange={(e) => updateSku(index, "sku_code", e.target.value)}
                  style={{ ...INPUT_STYLE, padding: "8px 12px", fontSize: 13 }}
                  placeholder="DRESS-BLK-S"
                />
              </div>
              <div>
                {index === 0 && <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Size</label>}
                <input
                  type="text"
                  value={sku.size}
                  onChange={(e) => updateSku(index, "size", e.target.value)}
                  style={{ ...INPUT_STYLE, padding: "8px 12px", fontSize: 13 }}
                  placeholder="S / M / L / 2Y"
                />
              </div>
              <div>
                {index === 0 && <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Colour</label>}
                <input
                  type="text"
                  value={sku.color}
                  onChange={(e) => updateSku(index, "color", e.target.value)}
                  style={{ ...INPUT_STYLE, padding: "8px 12px", fontSize: 13 }}
                  placeholder="Black"
                />
              </div>
              <div>
                {index === 0 && <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Hex</label>}
                <input
                  type="color"
                  value={sku.color_hex}
                  onChange={(e) => updateSku(index, "color_hex", e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    border: "1px solid var(--es-bone)",
                    borderRadius: 4,
                    cursor: "pointer",
                    padding: 2,
                  }}
                />
              </div>
              <div>
                {index === 0 && <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Stock</label>}
                <input
                  type="number"
                  min={0}
                  value={sku.stock_quantity}
                  onChange={(e) => updateSku(index, "stock_quantity", e.target.value)}
                  style={{ ...INPUT_STYLE, padding: "8px 12px", fontSize: 13 }}
                  placeholder="0"
                />
              </div>
              <div style={{ paddingTop: index === 0 ? 22 : 0, display: "flex", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => removeSku(index)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#c0392b",
                    fontSize: 18,
                    padding: "4px",
                    lineHeight: 1,
                  }}
                  title="Remove SKU"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={submitting}
            className="es-btn-plum"
            style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Saving…" : "Save Product"}
          </button>
          <Link
            href="/admin/products"
            className="es-btn-outline-ink"
            style={{ textDecoration: "none" }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
