"use client";

import { createContext, useContext, useReducer, useCallback, useState, useEffect } from "react";

const CART_STORAGE_KEY = "es_cart_v1";

export interface CartItem {
  productId: string;
  skuId: string;
  name: string;
  price: number;
  size?: string;
  color?: string;
  imageUrl: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; item: CartItem }
  | { type: "REMOVE"; skuId: string }
  | { type: "UPDATE_QTY"; skuId: string; quantity: number }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.findIndex((i) => i.skuId === action.item.skuId);
      if (existing >= 0) {
        const items = [...state.items];
        items[existing] = {
          ...items[existing]!,
          quantity: items[existing]!.quantity + action.item.quantity,
        };
        return { items };
      }
      return { items: [...state.items, action.item] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.skuId !== action.skuId) };
    case "UPDATE_QTY":
      return {
        items: state.items.map((i) =>
          i.skuId === action.skuId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (skuId: string) => void;
  updateQty: (skuId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCartFromStorage(): CartState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [] };
    return JSON.parse(raw) as CartState;
  } catch {
    return { items: [] };
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, loadCartFromStorage);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persist cart to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage unavailable (private browsing quota) — silently ignore
    }
  }, [state]);

  const addItem = useCallback((item: CartItem) => dispatch({ type: "ADD", item }), []);
  const removeItem = useCallback((skuId: string) => dispatch({ type: "REMOVE", skuId }), []);
  const updateQty = useCallback(
    (skuId: string, quantity: number) => dispatch({ type: "UPDATE_QTY", skuId, quantity }),
    []
  );
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items: state.items, itemCount, subtotal, addItem, removeItem, updateQty, clearCart, isCartOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

