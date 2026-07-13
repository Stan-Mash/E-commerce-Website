"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MultiImageUploader from "@/components/admin/MultiImageUploader";

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

// Plain-English explanation shown under a label. Small, low-emphasis —
// there to answer "what do I put here?" without shouting over the field.
const HELP_STYLE: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-inter)",
  fontSize: 12,
  lineHeight: 1.5,
  color: "var(--es-mute)",
  marginTop: 4,
  letterSpacing: "normal",
  textTransform: "none",
};

// Two-column on desktop, single column on narrow phones — replaces the old
// fixed "1fr 1fr" grid, which forced two ~150px inputs side by side even on
// a 320px-wide screen.
const FIELD_ROW_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 24,
  marginBottom: 28,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Builds a product code from the product name + size + colour, e.g.
// "Nairobi Wrap Dress" + "M" + "Blue" -> "NAIROB-M-BLUE". Users never need to
// understand or type this themselves in the common case — it fills itself in
// as they pick a size and colour, and stays editable for anyone who wants a
// custom code.
function autoSkuCode(productSlug: string, size: string, color: string): string {
  const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 8);
  return [clean(productSlug) || "ITEM", clean(size), clean(color)].filter(Boolean).join("-");
}

interface SkuForm {
  sku_code: string;
  size: string;
  color: string;
  color_hex: string;
  stock_quantity: string;
  // Once the shopkeeper types directly into the code field, stop
  // auto-overwriting it when they change size/colour afterward.
  codeTouched: boolean;
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
  category: "women",
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
  stock_quantity: "",
  codeTouched: false,
};

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [skus, setSkus] = useState<SkuForm[]>([{ ...BLANK_SKU }]);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Media gallery state
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

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
      prev.map((sku, i) => {
        if (i !== index) return sku;
        if (field === "sku_code") return { ...sku, sku_code: value, codeTouched: true };
        const next = { ...sku, [field]: value };
        if ((field === "size" || field === "color") && !sku.codeTouched) {
          next.sku_code = autoSkuCode(form.slug, next.size, next.color);
        }
        return next;
      })
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
        image_url: images[0] ?? null,
        images,
        videos,
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

      <p
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: 14,
          lineHeight: 1.6,
          color: "var(--es-mute)",
          maxWidth: 560,
          margin: "-32px 0 40px",
        }}
      >
        Fill in the details below, add photos, then add at least one size with
        its stock count near the bottom. Nothing here is permanent — you can
        come back and edit any of it later.
      </p>

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

        {/* Product Images */}
        <div style={{ marginBottom: 36 }}>
          <label style={LABEL_STYLE}>Product Images</label>
          <MultiImageUploader
            value={images}
            onChange={setImages}
            onUploadingChange={setImageUploading}
          />
        </div>

        {/* Product Videos */}
        <div style={{ marginBottom: 36 }}>
          <label style={LABEL_STYLE}>Product Videos</label>
          <MultiImageUploader
            kind="video"
            value={videos}
            onChange={setVideos}
            onUploadingChange={setVideoUploading}
          />
        </div>

        {/* Name + Slug */}
        <div style={FIELD_ROW_STYLE}>
          <div>
            <label htmlFor="name" style={LABEL_STYLE}>Product Name</label>
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
            <label htmlFor="slug" style={LABEL_STYLE}>Web Address</label>
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
            <span style={HELP_STYLE}>
              Filled in automatically from the name. Most people never need to touch this.
            </span>
            {errors["slug"] && (
              <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>{errors["slug"]}</p>
            )}
          </div>
        </div>

        {/* Category + Status */}
        <div style={FIELD_ROW_STYLE}>
          <div>
            <label htmlFor="category" style={LABEL_STYLE}>Category</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              style={{ ...INPUT_STYLE, cursor: "pointer" }}
            >
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="children">Children</option>
              <option value="accessories">Accessories</option>
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
              <option value="coming_soon">Coming Soon</option>
              <option value="archived">Archived</option>
            </select>
            <span style={HELP_STYLE}>
              Draft = hidden. Active = live for customers to buy. Coming Soon = visible but not buyable yet.
            </span>
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
        <div style={FIELD_ROW_STYLE}>
          <div>
            <label htmlFor="basePrice" style={LABEL_STYLE}>Selling Price (KES)</label>
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
            <span style={HELP_STYLE}>What the customer pays, in Kenyan Shillings.</span>
            {errors["basePrice"] && (
              <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>{errors["basePrice"]}</p>
            )}
          </div>
          <div>
            <label htmlFor="comparePrice" style={LABEL_STYLE}>
              Original Price
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
            <span style={HELP_STYLE}>
              Only fill this in to show a discount, e.g. &ldquo;Was 10,000, Now 8,500.&rdquo;
            </span>
          </div>
        </div>

        {/* Material + Care */}
        <div style={FIELD_ROW_STYLE}>
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
          <span style={{ ...HELP_STYLE, marginLeft: 56 }}>
            Shows this item in the Featured section on your homepage.
          </span>
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
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div>
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
                Sizes, Colours &amp; Stock
              </p>
              <span style={{ ...HELP_STYLE, marginTop: 6, maxWidth: 420 }}>
                Add one card below for every size or colour you sell, with how
                many you have of each. At least one is required.
              </span>
            </div>
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
                padding: "8px 16px",
                cursor: "pointer",
                borderRadius: 2,
                flexShrink: 0,
              }}
            >
              + Add Size
            </button>
          </div>

          {skus.map((sku, index) => (
            <div
              key={index}
              style={{
                border: "1px solid var(--es-bone)",
                borderRadius: 8,
                padding: 16,
                marginBottom: 14,
                background: "var(--es-white)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ ...LABEL_STYLE, marginBottom: 0 }}>Size {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeSku(index)}
                  aria-label={`Remove size ${index + 1}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#c0392b",
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "8px 4px",
                  }}
                >
                  Remove ×
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 14 }}>
                <div>
                  <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Size</label>
                  <input
                    type="text"
                    value={sku.size}
                    onChange={(e) => updateSku(index, "size", e.target.value)}
                    style={{ ...INPUT_STYLE, padding: "8px 12px", fontSize: 13 }}
                    placeholder="S / M / L / 2Y"
                  />
                </div>
                <div>
                  <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Colour</label>
                  <input
                    type="text"
                    value={sku.color}
                    onChange={(e) => updateSku(index, "color", e.target.value)}
                    style={{ ...INPUT_STYLE, padding: "8px 12px", fontSize: 13 }}
                    placeholder="Black"
                  />
                </div>
                <div>
                  <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Swatch</label>
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
                  <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={sku.stock_quantity}
                    onChange={(e) => updateSku(index, "stock_quantity", e.target.value)}
                    style={{ ...INPUT_STYLE, padding: "8px 12px", fontSize: 13 }}
                    placeholder="0"
                  />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>
                  Product Code
                  <span style={{ marginLeft: 6, fontSize: 10, color: "#aaa", textTransform: "none", letterSpacing: 0 }}>
                    (auto-filled)
                  </span>
                </label>
                <input
                  type="text"
                  value={sku.sku_code}
                  onChange={(e) => updateSku(index, "sku_code", e.target.value)}
                  style={{ ...INPUT_STYLE, padding: "8px 12px", fontSize: 13, maxWidth: 280 }}
                  placeholder="Fills in once you enter a size"
                />
                <span style={{ ...HELP_STYLE, maxWidth: 420 }}>
                  A short code so this size/colour can be told apart from others. Filled in for you — only change it if you want something custom.
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={submitting || imageUploading || videoUploading}
            className="es-btn-plum"
            style={{ opacity: submitting || imageUploading || videoUploading ? 0.7 : 1, cursor: submitting || imageUploading || videoUploading ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Saving…" : (imageUploading || videoUploading) ? "Waiting for upload…" : "Save Product"}
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
