"use client";

import { useState } from "react";
import { ShoppingBag, Heart, Share2, Truck, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/checkout/CartProvider";
import { formatKES } from "@/lib/utils";
import type { ProductDetail } from "@nairobi-fashion/lib";

interface Props {
  product: ProductDetail;
}

export function ProductInfo({ product }: Props) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState("");

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

  const inStock = selectedSku ? selectedSku.stock_quantity > 0 : true;
  const discount =
    product.compare_price && product.compare_price > product.base_price
      ? Math.round(
          ((product.compare_price - product.base_price) / product.compare_price) * 100
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
      size: selectedSize ?? undefined,
      color: selectedColor ?? undefined,
      imageUrl: product.product_images?.[0]?.url ?? "",
      quantity: 1,
    });
    setAddedMessage("Added to bag!");
    setAdding(false);
    setTimeout(() => setAddedMessage(""), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Category badge */}
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
        {product.category}
      </p>

      {/* Name */}
      <h1 className="font-display text-2xl sm:text-3xl text-ink leading-snug">
        {product.name}
      </h1>

      {/* Price */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-2xl font-bold text-ink">
          {formatKES(product.base_price)}
        </span>
        {product.compare_price && product.compare_price > product.base_price && (
          <>
            <span className="text-base text-ink-muted line-through">
              {formatKES(product.compare_price)}
            </span>
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700">
              -{discount}%
            </span>
          </>
        )}
      </div>

      {/* Color selector */}
      {uniqueColors.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink mb-2">
            Colour:{" "}
            <span className="font-normal text-ink-soft">
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
                    ? "border-brand-500 scale-110 shadow-md"
                    : "border-gray-200 hover:border-gray-400"
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
          <p className="text-sm font-semibold text-ink mb-2">
            Size:{" "}
            <span className="font-normal text-ink-soft">
              {selectedSize ?? "Select"}
            </span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {uniqueSizes.map((size) => {
              const skuForSize = product.skus?.find(
                (s) => s.size === size
              );
              const available = (skuForSize?.stock_quantity ?? 0) > 0;
              return (
                <button
                  key={size}
                  onClick={() => available && setSelectedSize(size)}
                  disabled={!available}
                  className={cn(
                    "min-w-[44px] rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all",
                    selectedSize === size
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : available
                      ? "border-gray-200 text-ink hover:border-brand-300"
                      : "border-gray-100 text-gray-300 line-through cursor-not-allowed"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add to bag */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={adding || !inStock}
          className="btn-primary flex-1 text-base"
        >
          <ShoppingBag size={18} />
          {!inStock ? "Out of Stock" : adding ? "Adding…" : "Add to Bag"}
        </button>
        <button
          className="rounded-full border-2 border-gray-200 p-3 hover:border-brand-300 hover:text-brand-500 transition-colors"
          aria-label="Save to wishlist"
        >
          <Heart size={20} />
        </button>
        <button
          className="rounded-full border-2 border-gray-200 p-3 hover:border-brand-300 hover:text-brand-500 transition-colors"
          aria-label="Share product"
          onClick={() =>
            navigator.share?.({
              title: product.name,
              url: window.location.href,
            })
          }
        >
          <Share2 size={20} />
        </button>
      </div>

      {addedMessage && (
        <p className={cn(
          "text-sm font-medium",
          addedMessage.includes("Please") ? "text-red-500" : "text-green-600"
        )}>
          {addedMessage}
        </p>
      )}

      {/* Delivery options */}
      <div className="rounded-2xl bg-surface-soft border border-surface-warm p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Store size={18} className="text-brand-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-ink">Pickup — Free</p>
            <p className="text-xs text-ink-muted">Westlands Flagship · Ready in 2hrs</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Truck size={18} className="text-ink-muted mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-ink">Door Delivery</p>
            <p className="text-xs text-ink-muted">Nairobi from KES 250 · 1–2 days</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div>
          <h2 className="font-semibold text-sm text-ink mb-2">About this piece</h2>
          <p className="text-sm text-ink-soft leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Material / Care */}
      {(product.material ?? product.care_instructions) && (
        <div className="grid grid-cols-2 gap-4 text-xs text-ink-soft border-t border-surface-warm pt-4">
          {product.material && (
            <div>
              <p className="font-semibold text-ink mb-1">Material</p>
              <p>{product.material}</p>
            </div>
          )}
          {product.care_instructions && (
            <div>
              <p className="font-semibold text-ink mb-1">Care</p>
              <p>{product.care_instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
