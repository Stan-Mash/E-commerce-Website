"use client";

import { createContext, useContext, useReducer, useCallback } from "react";

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
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = useCallback((item: CartItem) => dispatch({ type: "ADD", item }), []);
  const removeItem = useCallback((skuId: string) => dispatch({ type: "REMOVE", skuId }), []);
  const updateQty = useCallback(
    (skuId: string, quantity: number) => dispatch({ type: "UPDATE_QTY", skuId, quantity }),
    []
  );
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items: state.items, itemCount, subtotal, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
