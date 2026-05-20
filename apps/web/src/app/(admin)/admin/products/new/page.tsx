"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

const INPUT_STYLE: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px 0",
  border: "none",
  borderBottom: "1px solid #e5e4df",
  background: "transparent",
  fontFamily: "var(--font-inter)",
  fontSize: 15,
  color: "#0a0a0a",
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
  marginBottom: 4,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface FormState {
  name: string;
  slug: string;
  category: string;
  description: string;
  basePrice: string;
  comparePrice: string;
  material: string;
  status: string;
}

const INITIAL_FORM: FormState = {
  name: "",
  slug: "",
  category: "Woman",
  description: "",
  basePrice: "",
  comparePrice: "",
  material: "",
  status: "draft",
};

export default function NewProductPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    },
    []
  );

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.slug.trim()) newErrors.slug = "Slug is required.";
    if (!form.basePrice || isNaN(Number(form.basePrice))) {
      newErrors.basePrice = "Valid base price is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        // Real Supabase insert would go here when connected
        // const { createClient } = await import("@/lib/supabase/client");
        // const supabase = createClient();
        // await supabase.from("products").insert({ ... });
      }
      // Log for now — Supabase not yet connected
      console.log("[Admin] New product payload:", {
        name: form.name,
        slug: form.slug,
        category: form.category,
        description: form.description,
        base_price: Number(form.basePrice),
        compare_price: form.comparePrice ? Number(form.comparePrice) : null,
        material: form.material,
        status: form.status,
      });
      setSaved(true);
    } catch (err) {
      console.error("Failed to save product:", err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleAddAnother() {
    setForm(INITIAL_FORM);
    setErrors({});
    setSaved(false);
  }

  if (saved) {
    return (
      <div>
        <div
          style={{
            maxWidth: 560,
            margin: "80px auto",
            textAlign: "center",
            padding: "0 24px",
          }}
        >
          {/* Green checkmark */}
          <svg
            width={56}
            height={56}
            viewBox="0 0 56 56"
            fill="none"
            style={{ marginBottom: 24 }}
            aria-hidden="true"
          >
            <circle cx={28} cy={28} r={28} fill="#e8f5e9" />
            <path
              d="M16 28l8 8 16-16"
              stroke="#2e7d32"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p
            style={{
              fontFamily: "var(--font-bodoni)",
              fontSize: 26,
              color: "var(--es-ink)",
              marginBottom: 12,
              fontWeight: 400,
            }}
          >
            Product saved.
          </p>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 14,
              color: "var(--es-mute)",
              marginBottom: 40,
            }}
          >
            <strong style={{ color: "var(--es-ink)" }}>{form.name}</strong> has been added to
            the catalogue.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleAddAnother}
              className="es-btn-outline-ink"
              type="button"
            >
              Add Another
            </button>
            <Link href="/admin/products" className="es-btn-plum">
              View Products
            </Link>
          </div>
        </div>
      </div>
    );
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

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate style={{ maxWidth: 640 }}>
        {/* Name */}
        <div style={{ marginBottom: 32 }}>
          <label htmlFor="name" style={LABEL_STYLE}>
            Name
          </label>
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
          {errors.name && (
            <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>{errors.name}</p>
          )}
        </div>

        {/* Slug */}
        <div style={{ marginBottom: 32 }}>
          <label htmlFor="slug" style={LABEL_STYLE}>
            Slug
          </label>
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
          {errors.slug && (
            <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>{errors.slug}</p>
          )}
        </div>

        {/* Category */}
        <div style={{ marginBottom: 32 }}>
          <label htmlFor="category" style={LABEL_STYLE}>
            Category
          </label>
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
          </select>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 32 }}>
          <label htmlFor="description" style={LABEL_STYLE}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            style={{
              ...INPUT_STYLE,
              resize: "vertical",
              borderBottom: "none",
              border: "1px solid #e5e4df",
              padding: "10px 12px",
              borderRadius: 2,
            }}
            placeholder="Describe the product…"
          />
        </div>

        {/* Price row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div>
            <label htmlFor="basePrice" style={LABEL_STYLE}>
              Base Price KES
            </label>
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
            {errors.basePrice && (
              <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>{errors.basePrice}</p>
            )}
          </div>
          <div>
            <label htmlFor="comparePrice" style={LABEL_STYLE}>
              Compare Price KES
              <span
                style={{
                  marginLeft: 6,
                  fontFamily: "var(--font-inter)",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  color: "#aaa",
                  textTransform: "none",
                }}
              >
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

        {/* Material */}
        <div style={{ marginBottom: 32 }}>
          <label htmlFor="material" style={LABEL_STYLE}>
            Material
          </label>
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

        {/* Status */}
        <div style={{ marginBottom: 48 }}>
          <label htmlFor="status" style={LABEL_STYLE}>
            Status
          </label>
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
