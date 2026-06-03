"use client";

import { useState } from "react";
import { useCart } from "@/components/checkout/CartProvider";

interface Sku {
  id: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
  price: number;
}

interface Props {
  productId: string;
  productName: string;
  imageUrl: string;
  skus: Sku[];
}

export function AddToBag({ productId, productName, imageUrl, skus }: Props) {
  const { addItem } = useCart();

  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(
    skus.length === 1 ? (skus[0]?.id ?? null) : null
  );
  const [adding, setAdding]   = useState(false);
  const [added,  setAdded]    = useState(false);

  const sizes      = [...new Set(skus.map((s) => s.size).filter(Boolean))];
  const selectedSku = skus.find((s) => s.id === selectedSkuId);
  const isOutOfStock = selectedSku ? selectedSku.stock_quantity === 0 : false;

  async function handleAdd() {
    if (!selectedSku || isOutOfStock || adding) return;
    setAdding(true);
    addItem({
      productId,
      skuId: selectedSku.id,
      name: productName,
      price: selectedSku.price,
      ...(selectedSku.size  ? { size:  selectedSku.size  } : {}),
      ...(selectedSku.color ? { color: selectedSku.color } : {}),
      imageUrl,
      quantity: 1,
    });
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  const ctaLabel = isOutOfStock
    ? "Currently Unavailable"
    : adding
      ? "Adding…"
      : added
        ? "Added to Bag"
        : selectedSku
          ? `Add to Bag — ${new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(selectedSku.price)}`
          : "Select a Size";

  return (
    <div className="space-y-5">

      {/* Size selector */}
      {sizes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="es-eyebrow">Select Size</p>
            <button
              type="button"
              className="text-[11px] font-medium text-es-champagne-dk underline underline-offset-2 hover:text-es-ink transition-colors"
            >
              How It Fits
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {skus.map((sku) => {
              if (!sku.size) return null;
              const isSelected = sku.id === selectedSkuId;
              const depleted   = sku.stock_quantity === 0;
              return (
                <button
                  key={sku.id}
                  type="button"
                  onClick={() => !depleted && setSelectedSkuId(sku.id)}
                  disabled={depleted}
                  aria-pressed={isSelected}
                  aria-label={depleted ? `${sku.size} — sold out` : sku.size ?? undefined}
                  className={[
                    "min-w-[52px] h-11 px-3 border text-[13px] font-medium font-sans",
                    "transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2",
                    isSelected
                      ? "border-es-ink bg-es-ink text-white"
                      : depleted
                        ? "border-es-hair text-es-faint cursor-not-allowed line-through"
                        : "border-es-rule text-es-char hover:border-es-ink",
                  ].join(" ")}
                >
                  {sku.size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary CTA */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={!selectedSku || isOutOfStock || adding}
        aria-label={`${ctaLabel} — ${productName}`}
        className={[
          "w-full py-4 text-[12px] font-bold tracking-label uppercase font-sans",
          "transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2",
          "disabled:opacity-60 active:scale-[0.99]",
          isOutOfStock
            ? "bg-es-bone text-es-faint cursor-not-allowed"
            : added
              ? "bg-es-champagne-dk text-white"
              : "bg-es-ink text-white hover:bg-es-char cursor-pointer",
        ].join(" ")}
      >
        {ctaLabel}
      </button>

      {/* Low stock nudge — only when genuinely limited */}
      {selectedSku && !isSoldOut(selectedSku) && selectedSku.stock_quantity <= 3 && (
        <p className="text-[11px] text-es-champagne-dk font-medium tracking-wide text-center font-sans">
          Only {selectedSku.stock_quantity} remaining
        </p>
      )}
    </div>
  );
}

function isSoldOut(sku: Sku) {
  return sku.stock_quantity === 0;
}
