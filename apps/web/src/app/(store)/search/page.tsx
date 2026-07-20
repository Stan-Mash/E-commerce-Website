"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { formatKES } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types - mirror the API /api/search response
// ---------------------------------------------------------------------------
interface ProductResult {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  compare_price: number | null;
  category: string;
  product_images: { url: string; alt: string | null; sort_order: number }[];
  skus: { size: string; stock_quantity: number }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  women: "Woman",
  men: "Man",
  children: "Children",
  accessories: "Accessories",
};

// Downscale a photo to maxDim px and return raw base64 JPEG — keeps uploads
// small on mobile data.
async function compressToBase64(file: File, maxDim = 512): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setPhotoMode(false);
    setPhotoError("");
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
      setSearched(true);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setResults([]);
        setSearched(true);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  // Pre-fill from ?q= so links (e.g. the homepage SearchAction / shared URLs) work.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    setQuery("");
    setLoading(true);
    try {
      const imageBase64 = await compressToBase64(file);
      const res = await fetch("/api/search/visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhotoError(data.error ?? "Visual search failed. Please try again.");
        setResults([]);
        setSearched(false);
        setPhotoMode(false);
      } else {
        setResults(Array.isArray(data.results) ? data.results : []);
        setSearched(true);
        setPhotoMode(true);
      }
    } catch {
      setPhotoError("Could not read that photo. Try another.");
    } finally {
      setLoading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  const trimmed = query.trim();

  return (
    <main className="min-h-screen bg-es-white">
      {/* Search input */}
      <div
        className="mx-auto w-full max-w-[700px] px-6 sm:px-16"
        style={{ paddingTop: "120px", paddingBottom: "32px" }}
      >
        <label htmlFor="search-input" className="sr-only">
          Search for pieces, fabrics, styles
        </label>
        <div style={{ position: "relative" }}>
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for pieces, fabrics, styles…"
            autoFocus
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1.5px solid #0a0a0a",
              outline: "none",
              fontSize: "24px",
              fontFamily: "var(--font-inter), sans-serif",
              color: "#0a0a0a",
              padding: "8px 0",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderBottomColor = "var(--es-ink)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderBottomColor = "#0a0a0a";
            }}
          />
          {loading && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: 18,
                height: 18,
                border: "2px solid #e8e0d4",
                borderTopColor: "var(--es-ink)",
                borderRadius: "50%",
                animation: "es-spin 0.7s linear infinite",
              }}
            />
          )}
        </div>

        {/* Search by photo */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => void handlePhoto(e)}
          style={{ display: "none" }}
          id="visual-search-input"
        />
        <label
          htmlFor="visual-search-input"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 14,
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "var(--es-plum)",
            cursor: "pointer",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Search by photo
        </label>
        {photoError && (
          <p style={{ marginTop: 8, fontSize: 13, color: "#c0392b" }}>{photoError}</p>
        )}
        <style>{`@keyframes es-spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
      </div>

      {/* Results */}
      {(trimmed.length >= 2 || photoMode) && searched && (
        <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-16 pb-20">
          {results.length === 0 ? (
            <p
              className="text-center text-xl"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontStyle: "italic",
                color: "#717171",
              }}
            >
              {photoMode ? "No similar pieces found for that photo" : <>No pieces found for &lsquo;{trimmed}&rsquo;</>}
            </p>
          ) : (
            <>
              <p className="mb-8 text-[11px] tracking-[.28em] uppercase text-es-mute">
                {results.length} {results.length === 1 ? "result" : "results"} {photoMode ? "similar to your photo" : <>for &lsquo;{trimmed}&rsquo;</>}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                {results.map((product) => {
                  const img = [...(product.product_images ?? [])].sort(
                    (a, b) => a.sort_order - b.sort_order
                  )[0];
                  const sizeCount = [
                    ...new Set(product.skus?.map((s) => s.size) ?? []),
                  ].length;
                  const hasCompare =
                    product.compare_price &&
                    product.compare_price > product.base_price;
                  const categoryLabel =
                    CATEGORY_LABELS[product.category?.toLowerCase()] ??
                    product.category;

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group block"
                      aria-label={`View ${product.name}`}
                    >
                      <div className="relative w-full overflow-hidden bg-es-bone mb-3">
                        <div style={{ paddingBottom: "125%" }} />
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img.url}
                            alt={img.alt ?? product.name}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#e8dff0] to-[#c9a96130]" />
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] tracking-[.4em] uppercase text-es-mute">
                          {categoryLabel}
                        </p>
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="text-base sm:text-xl font-bold leading-tight text-es-ink"
                            style={{ fontFamily: "var(--font-bodoni)" }}
                          >
                            {product.name}
                          </p>
                          {sizeCount > 0 && (
                            <span className="mt-1 shrink-0 text-[10px] tracking-[.34em] uppercase text-es-mute whitespace-nowrap">
                              {sizeCount} {sizeCount === 1 ? "SIZE" : "SIZES"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm tracking-[.28em] text-es-ink">
                            {formatKES(product.base_price)}
                          </span>
                          {hasCompare && (
                            <span className="text-sm tracking-[.28em] text-es-mute line-through">
                              {formatKES(product.compare_price!)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
