"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "buildmarket-favorites";
const STORAGE_EVENT = "buildmarket-favorites-change";
const EMPTY_FAVORITES: FavoriteItem[] = [];
let cachedFavoritesRaw: string | null = null;
let cachedFavoriteItems: FavoriteItem[] = EMPTY_FAVORITES;

export type FavoriteItem = {
  id: string;
  name: string;
  article?: string;
  code?: string;
  price?: number;
  image?: string | null;
};

type FavoriteContextValue = {
  items: FavoriteItem[];
  itemCount: number;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
};

const FavoriteContext = createContext<FavoriteContextValue | null>(null);

function normalizeFavoriteItems(value: unknown): FavoriteItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: String(item.id ?? ""),
      name: String(item.name ?? ""),
      article: item.article ? String(item.article) : undefined,
      code: item.code ? String(item.code) : undefined,
      price: typeof item.price === "number" ? item.price : undefined,
      image: item.image ? String(item.image) : undefined,
    }))
    .filter((item) => item.id && item.name);
}

function readFavoriteItems() {
  if (typeof window === "undefined") return EMPTY_FAVORITES;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === cachedFavoritesRaw) {
      return cachedFavoriteItems;
    }

    cachedFavoritesRaw = stored;
    cachedFavoriteItems = stored ? normalizeFavoriteItems(JSON.parse(stored)) : EMPTY_FAVORITES;
    return cachedFavoriteItems;
  } catch {
    return EMPTY_FAVORITES;
  }
}

function readServerFavoriteItems() {
  return EMPTY_FAVORITES;
}

function writeFavoriteItems(items: FavoriteItem[]) {
  cachedFavoriteItems = items;
  cachedFavoritesRaw = JSON.stringify(items);
  window.localStorage.setItem(STORAGE_KEY, cachedFavoritesRaw);
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

export function FavoriteProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, readFavoriteItems, readServerFavoriteItems);

  const value = useMemo<FavoriteContextValue>(() => {
    const idSet = new Set(items.map((item) => item.id));

    return {
      items,
      itemCount: items.length,
      isFavorite: (id) => idSet.has(id),
      toggleFavorite: (item) => {
        const current = readFavoriteItems();
        if (current.some((entry) => entry.id === item.id)) {
          writeFavoriteItems(current.filter((entry) => entry.id !== item.id));
          return;
        }
        writeFavoriteItems([...current, item]);
      },
      removeFavorite: (id) => {
        writeFavoriteItems(readFavoriteItems().filter((item) => item.id !== id));
      },
      clearFavorites: () => {
        writeFavoriteItems([]);
      },
    };
  }, [items]);

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoriteProvider");
  }
  return context;
}
