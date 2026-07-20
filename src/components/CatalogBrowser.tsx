"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import type { MoyskladAssortmentItem, MoyskladProductFolder } from "@/lib/moysklad";
import { PROMO_PRODUCTS } from "@/lib/promo-products";

function formatPrice(value?: number) {
  if (value == null) return null;
  return (value / 100).toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });
}

type FolderInfo = {
  name?: string;
  pathName?: string | null;
  productFolder?: FolderInfo | null;
};

const splitFolderPath = (value?: string | null) =>
  (value ?? "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

const getFolderSegments = (folder?: FolderInfo | null) => {
  if (!folder?.name) return splitFolderPath(folder?.pathName);
  return [...splitFolderPath(folder.pathName), folder.name].filter(Boolean);
};

const getGroupLabel = (folder?: FolderInfo | null) => {
  if (!folder) return undefined;
  if (folder.productFolder?.name) return folder.productFolder.name;
  const segments = getFolderSegments(folder);
  if (segments.length >= 2) return segments[segments.length - 2];
  return segments[0];
};

const getSubgroupLabel = (folder?: FolderInfo | null) => {
  if (!folder) return undefined;
  const segments = getFolderSegments(folder);
  return segments[segments.length - 1];
};

type CatalogSection = "all" | "promo" | "folder";

type Props = {
  folders: MoyskladProductFolder[];
  initialItems: MoyskladAssortmentItem[];
  initialFolderId?: string;
  initialSection?: "all" | "promo";
};

export default function CatalogBrowser({ folders, initialItems, initialFolderId, initialSection = "all" }: Props) {
  const initialFolder = useMemo(
    () => (initialFolderId ? folders.find((folder) => folder.id === initialFolderId) ?? null : null),
    [folders, initialFolderId]
  );
  const [activeFolder, setActiveFolder] = useState<MoyskladProductFolder | null>(initialFolder);
  const [activeSection, setActiveSection] = useState<CatalogSection>(
    initialFolder ? "folder" : initialSection
  );
  const [allItems, setAllItems] = useState<MoyskladAssortmentItem[]>(initialFolder ? [] : initialItems);
  const [items, setItems] = useState<MoyskladAssortmentItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { addItem, items: cartItems, setQuantity } = useCart();

  const loadByFolder = useCallback(async (folder: MoyskladProductFolder) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/moysklad/by-folder?folderHref=${encodeURIComponent(folder.meta.href)}&limit=1000`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setItems(data.rows ?? []);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllItems = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/moysklad/assortment?limit=1000`, { signal: controller.signal });
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      const rows = data.rows ?? [];
      setAllItems(rows);
      setItems(rows);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFolderClick = (folder: MoyskladProductFolder) => {
    setActiveSection("folder");
    setActiveFolder(folder);
    loadByFolder(folder);
  };

  const handleShowAll = () => {
    if (abortRef.current) abortRef.current.abort();
    setActiveSection("all");
    setActiveFolder(null);
    if (allItems.length) {
      setItems(allItems);
      return;
    }
    loadAllItems();
  };

  const handleShowPromo = () => {
    if (abortRef.current) abortRef.current.abort();
    setLoading(false);
    setActiveSection("promo");
    setActiveFolder(null);
  };

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleAddToCart = (item: MoyskladAssortmentItem) => {
    addItem(item);
  };

  const handleIncrease = (id: string, current: number) => {
    setQuantity(id, current + 1);
  };

  const handleDecrease = (id: string, current: number) => {
    if (current <= 1) {
      setQuantity(id, 0);
      return;
    }
    setQuantity(id, current - 1);
  };

  const handleQuantityInput = (id: string, value: string) => {
    const parsed = Number(value.replace(/[^0-9]/g, ""));
    if (Number.isNaN(parsed)) return;
    setQuantity(id, Math.max(0, parsed));
  };

  return (
    <div className="flex min-h-[400px] flex-col md:flex-row md:gap-0">
      {/* Sidebar групп — горизонтальный скролл на мобильных, вертикальный на md+ */}
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white md:w-56 md:border-b-0 md:border-r lg:w-64">
        {/* Мобильный вид: горизонтальные кнопки-чипы */}
        <div className="flex gap-2 overflow-x-auto px-3 py-3 md:hidden">
          <button
            type="button"
            onClick={handleShowAll}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              activeSection === "all" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            Все
          </button>
          <button
            type="button"
            onClick={handleShowPromo}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              activeSection === "promo" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700"
            }`}
          >
            Акции
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => handleFolderClick(folder)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activeSection === "folder" && activeFolder?.id === folder.id ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {folder.name}
            </button>
          ))}
        </div>
        {/* Десктоп: вертикальный список */}
        <div className="sticky top-16 hidden md:block">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Группы товаров</p>
          </div>
          <ul className="py-2">
            <li>
              <button
                type="button"
                onClick={handleShowAll}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                  activeSection === "all"
                    ? "bg-amber-50 font-semibold text-amber-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Все товары
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={handleShowPromo}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                  activeSection === "promo"
                    ? "bg-amber-50 font-semibold text-amber-700"
                    : "text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                }`}
              >
                <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2.2 4.46 4.92.72-3.56 3.47.84 4.9L12 14.23l-4.4 2.32.84-4.9-3.56-3.47 4.92-.72L12 3z" />
                </svg>
                Акции
              </button>
            </li>
            {folders.map((folder) => (
              <li key={folder.id}>
                <button
                  type="button"
                  onClick={() => handleFolderClick(folder)}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                    activeSection === "folder" && activeFolder?.id === folder.id
                      ? "bg-amber-50 font-semibold text-amber-700"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5A1 1 0 0011.121 7H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>
                  <span className="leading-tight">{folder.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Область товаров */}
      <div className="flex-1 bg-stone-50 p-3 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {activeSection === "promo" ? "Акции" : activeFolder ? activeFolder.name : "Все товары"}
            </h2>
            <p className="text-sm text-slate-400">
              {loading ? "Загрузка..." : `${activeSection === "promo" ? PROMO_PRODUCTS.length : items.length} товаров`}
            </p>
          </div>
          {loading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          )}
        </div>

        {activeSection === "promo" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {PROMO_PRODUCTS.map((product) => (
              <div key={product.id} className="flex flex-col overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image src={product.image} alt={product.title} fill className="object-cover" sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 26vw, (min-width: 640px) 45vw, 100vw" />
                  <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow">−{product.discount}%</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-600">Акция</p>
                  <h3 className="mt-2 flex-1 font-semibold leading-snug text-slate-900">{product.title}</h3>
                  <p className="mt-3 text-xs text-green-600">● В наличии: {product.stock}</p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <span className="text-lg font-bold text-amber-600">{product.price}</span>
                    <span className="text-xs text-slate-400 line-through">{product.oldPrice}</span>
                  </div>
                  <a href="tel:84997025545" className="mt-4 rounded-lg bg-amber-500 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-amber-600">
                    Заказать
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {items.length === 0 && !loading && (
              <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <p className="text-sm text-slate-400">Товаров в этой группе нет</p>
              </div>
            )}

            <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}>
              {items.map((item) => {
                const price = item.salePrices?.[0]?.value;
                const groupLabel = getGroupLabel(item.productFolder);
                const subgroupLabel = getSubgroupLabel(item.productFolder);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md"
                  >
                    <div>
                      <div className="mb-4 overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 via-white to-slate-200">
                        <div className="aspect-[4/3] w-full">
                          <div className="flex h-full w-full items-center justify-center">
                            <div className="text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-300">
                              Фото
                              <br />
                              скоро
                            </div>
                          </div>
                        </div>
                      </div>
                      {groupLabel && (
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{groupLabel}</p>
                      )}
                      <p className="font-semibold leading-snug text-slate-900">{item.name}</p>
                      {item.article && (
                        <p className="mt-1 text-xs text-slate-400">Арт: {item.article}</p>
                      )}
                      {item.code && (
                        <p className="text-xs text-slate-400">Код: {item.code}</p>
                      )}
                      {subgroupLabel && (
                        <p className="mt-1 text-xs font-semibold text-amber-600">{subgroupLabel}</p>
                      )}
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        {formatPrice(price) ? (
                          <p className="text-base font-bold text-amber-600">{formatPrice(price)}</p>
                        ) : (
                          <p className="text-xs text-slate-400">Цена по запросу</p>
                        )}
                        {item.quantity != null && (
                          <p className="text-xs text-slate-500">В наличии: {item.quantity}</p>
                        )}
                      </div>
                      {(() => {
                        const quantityInCart = cartItems.find((cartItem) => cartItem.id === item.id)?.quantity ?? 0;
                        if (quantityInCart === 0) {
                          return (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item)}
                              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
                            >
                              В корзину
                            </button>
                          );
                        }

                        return (
                          <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/70 px-2 py-0.5">
                            <button
                              type="button"
                              onClick={() => handleDecrease(item.id, quantityInCart)}
                              className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-amber-700 shadow hover:bg-amber-100"
                              aria-label="Уменьшить количество"
                            >
                              −
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={quantityInCart}
                              onChange={(event) => handleQuantityInput(item.id, event.target.value)}
                              className="h-5 w-10 rounded-md border border-transparent bg-transparent text-center text-[11px] font-semibold text-amber-900 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleIncrease(item.id, quantityInCart)}
                              className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-amber-700 shadow hover:bg-amber-100"
                              aria-label="Увеличить количество"
                            >
                              +
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
