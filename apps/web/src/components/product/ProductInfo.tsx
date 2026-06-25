"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Heart, Share2, Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/checkout/CartProvider";
import { formatKES } from "@/lib/utils";
import { SizeGuide } from "@/components/product/SizeGuide";
import type { ProductDetail } from "@nairobi-fashion/lib";

const LOW_STOCK_THRESHOLD = 5;

function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("es_wishlist") ?? "[]") as string[]; }
  catch { return []; }
}
function writeWishlist(ids: string[]) {
  localStorage.setItem("es_wishlist", JSON.stringify(ids));
}

interface Props {
  product: ProductDetail;
}

export function ProductInfo({ product }: Props) {
  const { addItem, openCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setWishlisted(readWishlist().includes(product.id));
  }, [product.id]);

  function toggleWishlist() {
    const list = readWishlist();
    const next = list.includes(product.id)
      ? list.filter((id) => id !== product.id)
      : [...list, product.id];
    writeWishlist(next);
    setWishlisted(next.includes(product.id));
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      void navigator.share({ title: product.name, url });
    } else {
      void navigator.clipboard?.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  const uniqueSizes = [...new Set(product.skus?.map((s) => s.size) ?? [])];
  const uniqueColors = [
    ...new Map(
      (product.skus ?? [])
        .filter((s) => s.color)
        .map((s) => [s.color, { color: s.color!, colorHex: s.color_hex }])
    ).values(),
  ];

  const selectedSku = product.skus?.find(
    (s) =>
      s.size === selectedSize &&
      (uniqueColors.length === 0 || s.color === selectedColor)
  );

  const isComingSoon = product.status === "coming_soon";
  // If a SKU is selected, check its stock. If nothing is selected yet, fall back
  // to whether ANY SKU across the product has stock - so a product where every
  // size is zero-stock shows "OUT OF STOCK" instead of appearing clickable.
  const anySkuInStock = product.skus
    ? product.skus.length === 0 || product.skus.some((s) => s.stock_quantity > 0)
    : true;
  const inStock = selectedSku ? selectedSku.stock_quantity > 0 : anySkuInStock;
  const discount =
    product.compare_price && product.compare_price > product.base_price
      ? Math.round(
          ((product.compare_price - product.base_price) /
            product.compare_price) *
            100
        )
      : null;

  async function handleAddToCart() {
    if (!selectedSize && uniqueSizes.length > 0) {
      setAddedMessage("Please select a size");
      return;
    }
    if (!selectedColor && uniqueColors.length > 0) {
      setAddedMessage("Please select a colour");
      return;
    }

    setAdding(true);
    addItem({
      productId: product.id,
      skuId: selectedSku?.id ?? product.skus?.[0]?.id ?? "",
      name: product.name,
      price: product.base_price,
      ...(selectedSize ? { size: selectedSize } : {}),
      ...(selectedColor ? { color: selectedColor } : {}),
      imageUrl: product.product_images?.[0]?.url ?? "",
      quantity: 1,
    });
    openCart();
    setAddedMessage("Added to bag!");
    setAdding(false);
    setTimeout(() => setAddedMessage(""), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Category label */}
      <p
        className="text-[11px] tracking-[.45em] uppercase"
        style={{ color: "#9b7b3f" }}
      >
        {product.category}
      </p>

      {/* Product name */}
      <h1
        className="font-bold leading-tight text-es-ink"
        style={{
          fontFamily: "var(--font-bodoni)",
          fontSize: "clamp(32px, 4vw, 48px)",
          letterSpacing: "-0.02em",
        }}
      >
        {product.name}
      </h1>

      {/* Price */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="tracking-[.28em] text-es-ink"
          style={{ fontSize: "15px" }}
        >
          {formatKES(product.base_price)}
        </span>
        {product.compare_price && product.compare_price > product.base_price && (
          <>
            <span
              className="tracking-[.28em] text-es-mute line-through"
              style={{ fontSize: "15px" }}
            >
              {formatKES(product.compare_price)}
            </span>
            {discount && (
              <span className="text-[11px] tracking-[.2em] uppercase text-es-gold">
                -{discount}%
              </span>
            )}
          </>
        )}
      </div>

      {/* Color selector */}
      {uniqueColors.length > 0 && (
        <div>
          <p
            className="text-es-ink mb-2"
            style={{ fontSize: "13px", letterSpacing: ".12em" }}
          >
            Colour:{" "}
            <span className="text-es-mute font-normal">
              {selectedColor ?? "Select"}
            </span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {uniqueColors.map(({ color, colorHex }) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color!)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  selectedColor === color
                    ? "border-es-ink scale-110 shadow-md"
                    : "border-es-bone hover:border-es-mute"
                )}
                style={{ backgroundColor: colorHex ?? color! }}
                title={color!}
                aria-label={`Select colour ${color}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size selector */}
      {uniqueSizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-es-ink"
              style={{ fontSize: "13px", letterSpacing: ".12em" }}
            >
              Size:{" "}
              <span className="text-es-mute font-normal">
                {selectedSize ?? "Select"}
              </span>
            </p>
            {product.category?.toLowerCase() !== "accessories" && <SizeGuide activeSize={selectedSize} />}
          </div>
          <div className="flex gap-2 flex-wrap">
            {uniqueSizes.map((size) => {
              const skuForSize = product.skus?.find((s) => s.size === size);
              const available = (skuForSize?.stock_quantity ?? 0) > 0;
              return (
                <button
                  key={size}
                  onClick={() => available && setSelectedSize(size)}
                  disabled={!available}
                  className={cn(
                    "min-w-[44px] min-h-[44px] border px-3 py-2 text-sm font-medium transition-all",
                    selectedSize === size
                      ? "border-es-ink text-es-ink"
                      : available
                      ? "border-es-bone text-es-ink hover:border-es-ink"
                      : "border-es-bone text-es-mute line-through cursor-not-allowed opacity-40"
                  )}
                  style={
                    selectedSize === size
                      ? { backgroundColor: "#f1e9f5" }
                      : undefined
                  }
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Low stock warning */}
      {selectedSku && selectedSku.stock_quantity > 0 && selectedSku.stock_quantity <= LOW_STOCK_THRESHOLD && (
        <p className="text-[11px] tracking-[.2em] uppercase" style={{ color: "#c0392b" }}>
          Only {selectedSku.stock_quantity} left
        </p>
      )}

      {/* Add to bag */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={adding || !inStock || isComingSoon}
          className="es-btn-plum flex-1"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          <ShoppingBag size={18} />
          {isComingSoon
            ? "COMING SOON"
            : !inStock
            ? "OUT OF STOCK"
            : adding
            ? "ADDING…"
            : "ADD TO BAG"}
        </button>
        <button
          onClick={toggleWishlist}
          className={cn(
            "border p-3 transition-colors",
            wishlisted
              ? "border-es-plum text-es-plum bg-es-plum/5"
              : "border-es-bone hover:border-es-ink hover:text-es-ink"
          )}
          aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
        >
          <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />
        </button>
        <button
          onClick={handleShare}
          className="border border-es-bone p-3 hover:border-es-ink hover:text-es-ink transition-colors relative"
          aria-label={copied ? "Link copied!" : "Share product"}
          title={copied ? "Link copied!" : "Share"}
        >
          {copied ? <Check size={20} /> : <Share2 size={20} />}
        </button>
      </div>

      {addedMessage && (
        <p
          className={cn(
            "text-[13px] tracking-[.15em]",
            addedMessage.includes("Please") ? "text-red-500" : "text-es-gold"
          )}
        >
          {addedMessage}
        </p>
      )}

      {/* Description */}
      {product.description && (
        <div>
          <h2
            className="text-[11px] tracking-[.35em] uppercase text-es-ink mb-3"
          >
            About this piece
          </h2>
          <p
            className="text-es-ink"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "15px",
              lineHeight: 1.65,
              color: "#171717",
            }}
          >
            {product.description}
          </p>
        </div>
      )}

      {/* Material / Care */}
      {(product.material ?? product.care_instructions) && (
        <div
          className="grid grid-cols-2 gap-4 text-[13px] text-es-mute border-t pt-4"
          style={{ borderColor: "#e5e4df" }}
        >
          {product.material && (
            <div>
              <p className="text-[11px] tracking-[.3em] uppercase text-es-ink mb-1.5">
                Material
              </p>
              <p style={{ lineHeight: 1.6 }}>{product.material}</p>
            </div>
          )}
          {product.care_instructions && (
            <div>
              <p className="text-[11px] tracking-[.3em] uppercase text-es-ink mb-1.5">
                Care
              </p>
              <p style={{ lineHeight: 1.6 }}>{product.care_instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
