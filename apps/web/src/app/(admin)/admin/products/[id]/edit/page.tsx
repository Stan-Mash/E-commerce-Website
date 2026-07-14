"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MultiImageUploader from "@/components/admin/MultiImageUploader";
import { SIZE_SUGGESTIONS } from "@/lib/sizeGuide";

const INPUT_STYLE: React.CSSProperties = {
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

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-inter)",
  fontSize: 11,
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "var(--es-mute)",
  marginBottom: 8,
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
  gap: 20,
};

function autoSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
  id?: string;
  sku_code: string;
  size: string;
  color: string;
  color_hex: string;
  stock_quantity: string;
  // Once the shopkeeper types directly into the code field, stop
  // auto-overwriting it when they change size/colour afterward. Existing
  // SKUs loaded from the database always start touched — we should never
  // silently rewrite a real product's existing code.
  codeTouched: boolean;
}

interface FormState {
  name: string;
  slug: string;
  category: string;
  description: string;
  base_price: string;
  compare_price: string;
  material: string;
  care_instructions: string;
  status: string;
  is_featured: boolean;
}

interface Props {
  params: { id: string };
}

export default function EditProductPage({ params }: Props) {
  const router = useRouter();
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [apiError, setApiError]   = useState<string | null>(null);
  const [saved, setSaved]         = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    slug: "",
    category: "women",
    description: "",
    base_price: "",
    compare_price: "",
    material: "",
    care_instructions: "",
    status: "draft",
    is_featured: false,
  });
  const [skus, setSkus] = useState<SkuForm[]>([]);

  // Media gallery state
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/products/${params.id}`);
        if (res.status === 401) { window.location.href = "/admin/login"; return; }
        if (!res.ok) { setNotFound(true); return; }

        const json = await res.json() as {
          product: {
            id: string;
            name: string;
            slug: string;
            category: string;
            description: string | null;
            base_price: number;
            compare_price: number | null;
            material: string | null;
            care_instructions: string | null;
            is_featured: boolean;
            status: string;
            image_url: string | null;
            product_images: Array<{ url: string; sort_order: number; media_type: string | null }> | null;
            product_videos: Array<{ cloudinary_url: string; sort_order: number }> | null;
            skus: Array<{
              id: string;
              sku_code: string;
              size: string;
              color: string | null;
              color_hex: string | null;
              stock_quantity: number;
            }>;
          };
        };
        const p = json.product;
        setForm({
          name:              p.name,
          slug:              p.slug,
          category:          p.category,
          description:       p.description ?? "",
          base_price:        String(p.base_price),
          compare_price:     p.compare_price != null ? String(p.compare_price) : "",
          material:          p.material ?? "",
          care_instructions: p.care_instructions ?? "",
          status:            p.status,
          is_featured:       p.is_featured,
        });
        // Load existing gallery (ordered); fall back to the legacy single image.
        const gallery = (p.product_images ?? [])
          .filter((i) => i.media_type !== "video")
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((i) => i.url);
        setImages(gallery.length > 0 ? gallery : p.image_url ? [p.image_url] : []);
        setVideos(
          (p.product_videos ?? [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((v) => v.cloudinary_url)
        );
        setSkus(
          (p.skus ?? []).map((s) => ({
            id:             s.id,
            sku_code:       s.sku_code,
            size:           s.size,
            color:          s.color ?? "",
            color_hex:      s.color_hex ?? "#000000",
            stock_quantity: String(s.stock_quantity),
            codeTouched:    true, // existing codes are never silently rewritten
          }))
        );
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.id]);

  const set = useCallback((key: keyof FormState, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }, []);

  function addSku() {
    setSkus((prev) => [
      ...prev,
      { sku_code: "", size: "", color: "", color_hex: "#000000", stock_quantity: "", codeTouched: false },
    ]);
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setApiError(null);

    try {
      const payload = {
        name:              form.name,
        slug:              form.slug,
        description:       form.description || null,
        category:          form.category,
        base_price:        Number(form.base_price),
        compare_price:     form.compare_price ? Number(form.compare_price) : null,
        material:          form.material || null,
        care_instructions: form.care_instructions || null,
        is_featured:       form.is_featured,
        status:            form.status,
        image_url:         images[0] ?? null,
        images,
        videos,
        skus: skus
          .filter((s) => s.sku_code.trim() && s.size.trim())
          .map((s) => ({
            id:             s.id,
            sku_code:       s.sku_code,
            size:           s.size,
            color:          s.color || null,
            color_hex:      s.color_hex || null,
            stock_quantity: Number(s.stock_quantity),
          })),
      };

      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json() as { error?: string };
      if (!res.ok) { setApiError(json.error ?? "Failed to save."); return; }

      setSaved(true);
      setTimeout(() => router.push("/admin/products"), 800);
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-inter)", color: "var(--es-mute)" }}>Loading…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ fontFamily: "var(--font-inter)", color: "var(--es-mute)" }}>Product not found.</p>
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

      <form onSubmit={(e) => void handleSave(e)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Product Images */}
          <div>
            <label style={LABEL_STYLE}>Product Images</label>
            <MultiImageUploader
              value={images}
              onChange={(next) => { setImages(next); setSaved(false); }}
              onUploadingChange={setImageUploading}
            />
          </div>

          {/* Product Videos */}
          <div>
            <label style={LABEL_STYLE}>Product Videos</label>
            <MultiImageUploader
              kind="video"
              value={videos}
              onChange={(next) => { setVideos(next); setSaved(false); }}
              onUploadingChange={setVideoUploading}
            />
          </div>

          {/* Name + Slug */}
          <div style={FIELD_ROW_STYLE}>
            <div>
              <label style={LABEL_STYLE}>Product Name</label>
              <input
                style={INPUT_STYLE}
                value={form.name}
                onChange={(e) => { set("name", e.target.value); set("slug", autoSlug(e.target.value)); }}
                required
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Web Address</label>
              <input style={INPUT_STYLE} value={form.slug} onChange={(e) => set("slug", e.target.value)} required />
              <span style={HELP_STYLE}>
                Filled in automatically from the name. Most people never need to touch this.
              </span>
            </div>
          </div>

          {/* Category + Status */}
          <div style={FIELD_ROW_STYLE}>
            <div>
              <label style={LABEL_STYLE}>Category</label>
              <select style={INPUT_STYLE} value={form.category} onChange={(e) => set("category", e.target.value)}>
                <option value="women">Women</option>
                <option value="men">Men</option>
                <option value="children">Children</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Status</label>
              <select style={INPUT_STYLE} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="active">Active</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <span style={HELP_STYLE}>
                Draft = hidden. Active = live for customers to buy. Coming Soon = visible but not buyable yet.
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={LABEL_STYLE}>Description</label>
            <textarea
              style={{ ...INPUT_STYLE, height: 120, resize: "vertical" }}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* Prices */}
          <div style={FIELD_ROW_STYLE}>
            <div>
              <label style={LABEL_STYLE}>Selling Price (KES)</label>
              <input type="number" style={INPUT_STYLE} value={form.base_price} onChange={(e) => set("base_price", e.target.value)} min={0} required />
              <span style={HELP_STYLE}>What the customer pays, in Kenyan Shillings.</span>
            </div>
            <div>
              <label style={LABEL_STYLE}>Original Price (optional)</label>
              <input type="number" style={INPUT_STYLE} value={form.compare_price} onChange={(e) => set("compare_price", e.target.value)} min={0} placeholder="Optional" />
              <span style={HELP_STYLE}>
                Only fill this in to show a discount, e.g. &ldquo;Was 10,000, Now 8,500.&rdquo;
              </span>
            </div>
          </div>

          {/* Material + Care */}
          <div style={FIELD_ROW_STYLE}>
            <div>
              <label style={LABEL_STYLE}>Material</label>
              <input style={INPUT_STYLE} value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="e.g. 100% Belgian Linen" />
            </div>
            <div>
              <label style={LABEL_STYLE}>Care Instructions</label>
              <input style={INPUT_STYLE} value={form.care_instructions} onChange={(e) => set("care_instructions", e.target.value)} placeholder="e.g. Hand wash cold" />
            </div>
          </div>

          {/* Featured toggle */}
          <div>
            <label style={{ ...LABEL_STYLE, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div
                onClick={() => set("is_featured", !form.is_featured)}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: form.is_featured ? "var(--es-plum)" : "var(--es-bone)",
                  position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 3, left: form.is_featured ? 23 : 3,
                    transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
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
          <div style={{ borderTop: "1px solid var(--es-bone)", paddingTop: 28 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
              <div>
                <p style={{ fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--es-mute)", margin: 0 }}>
                  Sizes, Colours &amp; Stock
                </p>
                <span style={{ ...HELP_STYLE, marginTop: 6, maxWidth: 420 }}>
                  Add one card below for every size or colour you sell, with how many you have of each. At least one is required.
                </span>
              </div>
              <button
                type="button"
                onClick={addSku}
                style={{
                  fontFamily: "var(--font-inter)", fontSize: 11, letterSpacing: "0.2em",
                  textTransform: "uppercase", color: "var(--es-plum)", background: "none",
                  border: "1px solid var(--es-plum)", padding: "8px 16px", cursor: "pointer", borderRadius: 2,
                  flexShrink: 0,
                }}
              >
                + Add Size
              </button>
            </div>

            {skus.map((sku, index) => (
              <div
                key={index}
                style={{ border: "1px solid var(--es-bone)", borderRadius: 8, padding: 16, marginBottom: 14, background: "var(--es-white)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ ...LABEL_STYLE, marginBottom: 0 }}>Size {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeSku(index)}
                    aria-label={`Remove size ${index + 1}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                      cursor: "pointer", color: "#c0392b", fontSize: 12, letterSpacing: "0.1em",
                      textTransform: "uppercase", padding: "8px 4px",
                    }}
                  >
                    Remove ×
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 14 }}>
                  <div>
                    <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Size</label>
                    <input type="text" value={sku.size} onChange={(e) => updateSku(index, "size", e.target.value)} style={{ ...INPUT_STYLE, padding: "8px 12px", fontSize: 13 }} placeholder="S / M / L" list="size-suggestions" />
                  </div>
                  <div>
                    <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Colour</label>
                    <input type="text" value={sku.color} onChange={(e) => updateSku(index, "color", e.target.value)} style={{ ...INPUT_STYLE, padding: "8px 12px", fontSize: 13 }} placeholder="Black" />
                  </div>
                  <div>
                    <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Swatch</label>
                    <input type="color" value={sku.color_hex} onChange={(e) => updateSku(index, "color_hex", e.target.value)} style={{ width: "100%", height: 38, border: "1px solid var(--es-bone)", borderRadius: 4, cursor: "pointer", padding: 2 }} />
                  </div>
                  <div>
                    <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Stock</label>
                    <input type="number" min={0} value={sku.stock_quantity} onChange={(e) => updateSku(index, "stock_quantity", e.target.value)} style={{ ...INPUT_STYLE, padding: "8px 12px", fontSize: 13 }} />
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

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 8, borderTop: "1px solid var(--es-bone)" }}>
            <button
              type="submit"
              disabled={saving || imageUploading || videoUploading}
              className="es-btn-plum"
              style={{ opacity: saving || imageUploading || videoUploading ? 0.7 : 1, cursor: saving || imageUploading || videoUploading ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving…" : (imageUploading || videoUploading) ? "Waiting for upload…" : "Save Changes"}
            </button>

            {saved && (
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#2e7d32", letterSpacing: "0.05em" }}>
                Saved — redirecting…
              </span>
            )}

            <Link
              href="/admin/products"
              style={{ marginLeft: "auto", fontFamily: "var(--font-inter)", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--es-mute)", textDecoration: "none" }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>

      {/* Autocomplete suggestions for the Size field above — still a free-text
          input (custom sizes are fine), this just makes it fast to pick a
          standard size and keeps the spelling consistent, so the storefront's
          size filter doesn't end up with near-duplicates like "5xl" and "5XL"
          for the same real size. */}
      <datalist id="size-suggestions">
        {SIZE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
      </datalist>
    </div>
  );
}
