"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MoyskladAssortmentItem, MoyskladProductFolder } from "@/lib/moysklad";

function formatPrice(value?: number) {
  if (value == null) return null;
  return (value / 100).toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });
}

type Props = {
  folders: MoyskladProductFolder[];
  initialItems: MoyskladAssortmentItem[];
};

export default function CatalogBrowser({ folders, initialItems }: Props) {
  const [activeFolder, setActiveFolder] = useState<MoyskladProductFolder | null>(null);
  const [items, setItems] = useState<MoyskladAssortmentItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadByFolder = useCallback(async (folder: MoyskladProductFolder) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/moysklad/by-folder?folderHref=${encodeURIComponent(folder.meta.href)}&limit=100`,
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

  const handleFolderHover = (folder: MoyskladProductFolder) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setActiveFolder(folder);
      loadByFolder(folder);
    }, 180);
  };

  const handleFolderLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  };

  const handleFolderClick = (folder: MoyskladProductFolder) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setActiveFolder(folder);
    loadByFolder(folder);
  };

  const handleShowAll = () => {
    if (abortRef.current) abortRef.current.abort();
    setActiveFolder(null);
    setItems(initialItems);
  };

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

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
              activeFolder === null ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            Все
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => handleFolderClick(folder)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activeFolder?.id === folder.id ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
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
                  activeFolder === null
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
            {folders.map((folder) => (
              <li key={folder.id}>
                <button
                  type="button"
                  onMouseEnter={() => handleFolderHover(folder)}
                  onMouseLeave={handleFolderLeave}
                  onClick={() => handleFolderClick(folder)}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                    activeFolder?.id === folder.id
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
              {activeFolder ? activeFolder.name : "Все товары"}
            </h2>
            <p className="text-sm text-slate-400">
              {loading ? "Загрузка..." : `${items.length} товаров`}
            </p>
          </div>
          {loading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          )}
        </div>

        {items.length === 0 && !loading && (
          <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <p className="text-sm text-slate-400">Товаров в этой группе нет</p>
          </div>
        )}

        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}>
          {items.map((item) => {
            const price = item.salePrices?.[0]?.value;
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md"
              >
                <div>
                  <p className="font-semibold leading-snug text-slate-900">{item.name}</p>
                  {item.article && (
                    <p className="mt-1 text-xs text-slate-400">Арт: {item.article}</p>
                  )}
                  {item.code && (
                    <p className="text-xs text-slate-400">Код: {item.code}</p>
                  )}
                  {item.productFolder?.name && (
                    <p className="mt-1 text-xs text-amber-600">{item.productFolder.name}</p>
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
                  <button
                    type="button"
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
                  >
                    В корзину
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
