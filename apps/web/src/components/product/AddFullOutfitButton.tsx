"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/checkout/CartProvider";

interface OutfitItem {
  id: string;
  name: string;
  base_price: number;
  imageUrl: string | null;
  skuId: string;
}

interface Props {
  items: OutfitItem[];
}

export function AddFullOutfitButton({ items }: Props) {
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    items.forEach((item) => {
      addItem({
        productId: item.id,
        skuId: item.skuId,
        name: item.name,
        price: item.base_price,
        imageUrl: item.imageUrl ?? "",
        quantity: 1,
      });
    });
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (items.length === 0) return null;

  return (
    <button
      type="button"
      onClick={handleAdd}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "13px 28px",
        background: added ? "#1abc9c" : "#1a1510",
        color: "#fff", border: "none", cursor: "pointer",
        fontSize: 10, letterSpacing: "0.38em", textTransform: "uppercase",
        fontFamily: "var(--font-inter,sans-serif)", fontWeight: 600,
        transition: "background 0.2s",
      }}
    >
      <ShoppingBag size={14} />
      {added ? `${items.length} items added ✓` : `Add Full Outfit · ${items.length} pieces`}
    </button>
  );
}
