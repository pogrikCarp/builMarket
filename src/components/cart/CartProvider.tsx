"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";

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

// Минимальная форма товара, нужная корзине - не завязана на конкретный источник
// данных (МойСклад и т.п.), поэтому её могут использовать разные компоненты
// (карточка товара, страница избранного и т.д.).
export type AddableItem = {
  id: string;
  name: string;
  article?: string;
  code?: string;
  price?: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: AddableItem) => void;
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
  // Тост "товар добавлен в корзину" - на мобильных экранах кнопка корзины в хедере
  // не всегда бросается в глаза, поэтому это основной способ убедиться, что товар
  // точно добавлен, и сразу перейти в корзину без поиска кнопки.
  const [toast, setToast] = useState<{ key: number; name: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);

    return {
      items,
      itemCount,
      total,
      addItem: (item) => {
        const current = readCartItems();
        const existing = current.find((entry) => entry.id === item.id);
        if (existing) {
          writeCartItems(
            current.map((entry) =>
              entry.id === item.id ? { ...entry, quantity: entry.quantity + 1, price: item.price } : entry
            )
          );
        } else {
          writeCartItems([
            ...current,
            {
              id: item.id,
              name: item.name,
              article: item.article,
              code: item.code,
              price: item.price,
              quantity: 1,
            },
          ]);
        }
        setToast({ key: Date.now(), name: item.name });
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

  return (
    <CartContext.Provider value={value}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex justify-center px-4 sm:bottom-6">
          <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-2xl">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Товар добавлен в корзину</p>
              <p className="truncate text-xs text-white/70">{toast.name}</p>
            </div>
            <Link
              href="/basket"
              onClick={() => setToast(null)}
              className="shrink-0 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-400"
            >
              Купить
            </Link>
            <button
              type="button"
              aria-label="Закрыть"
              onClick={() => setToast(null)}
              className="shrink-0 text-white/50 transition hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
