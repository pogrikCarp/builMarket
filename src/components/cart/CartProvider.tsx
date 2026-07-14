"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { MoyskladAssortmentItem } from "@/lib/moysklad";

const STORAGE_KEY = "buildmarket-cart";
const STORAGE_EVENT = "buildmarket-cart-change";
const EMPTY_CART: CartItem[] = [];
let cachedCartRaw: string | null = null;
let cachedCartItems: CartItem[] = EMPTY_CART;

export type CartItem = {
  id: string;
  name: string;
  article?: string;
  code?: string;
  price?: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: MoyskladAssortmentItem) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: String(item.id ?? ""),
      name: String(item.name ?? ""),
      article: item.article ? String(item.article) : undefined,
      code: item.code ? String(item.code) : undefined,
      price: typeof item.price === "number" ? item.price : undefined,
      quantity: typeof item.quantity === "number" && item.quantity > 0 ? Math.floor(item.quantity) : 1,
    }))
    .filter((item) => item.id && item.name);
}

function readCartItems() {
  if (typeof window === "undefined") return EMPTY_CART;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === cachedCartRaw) {
      return cachedCartItems;
    }

    cachedCartRaw = stored;
    cachedCartItems = stored ? normalizeCartItems(JSON.parse(stored)) : EMPTY_CART;
    return cachedCartItems;
  } catch {
    return EMPTY_CART;
  }
}

function readServerCartItems() {
  return EMPTY_CART;
}

function writeCartItems(items: CartItem[]) {
  cachedCartItems = items;
  cachedCartRaw = JSON.stringify(items);
  window.localStorage.setItem(STORAGE_KEY, cachedCartRaw);
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(STORAGE_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(STORAGE_EVENT, handler);
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, readCartItems, readServerCartItems);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);

    return {
      items,
      itemCount,
      total,
      addItem: (item) => {
        const price = item.salePrices?.[0]?.value;
        const current = readCartItems();
        const existing = current.find((entry) => entry.id === item.id);
        if (existing) {
          writeCartItems(
            current.map((entry) =>
              entry.id === item.id ? { ...entry, quantity: entry.quantity + 1, price } : entry
            )
          );
          return;
        }

        writeCartItems([
          ...current,
          {
            id: item.id,
            name: item.name,
            article: item.article,
            code: item.code,
            price,
            quantity: 1,
          },
        ]);
      },
      removeItem: (id) => {
        writeCartItems(readCartItems().filter((item) => item.id !== id));
      },
      setQuantity: (id, quantity) => {
        const current = readCartItems();
        if (quantity <= 0) {
          writeCartItems(current.filter((item) => item.id !== id));
          return;
        }

        writeCartItems(current.map((item) => (item.id === id ? { ...item, quantity } : item)));
      },
      clearCart: () => {
        writeCartItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
