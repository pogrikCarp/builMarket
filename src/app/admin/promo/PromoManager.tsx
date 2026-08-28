"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildFolderTree, type FolderLike } from "@/lib/folder-tree";

type Folder = FolderLike & { pathName?: string };

const BROWSE_PAGE_SIZE = 24;

type PromoItem = {
  id: string;
  productId: string;
  oldPrice: number | null;
  sortOrder: number;
  active: boolean;
  productName: string | null;
  productPrice: number | null;
  productMissing: boolean;
};

type SearchResult = {
  id: string;
  name: string;
  article?: string;
  salePrices?: { value: number }[];
  images?: { rows?: { miniature?: { href: string }; tiny?: { href: string }; meta: { href: string; downloadHref?: string } }[] };
};

function formatRub(kopecks: number | null) {
  if (kopecks == null) return "—";
  return (kopecks / 100).toLocaleString("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
}

function thumbnailUrl(result: SearchResult): string | null {
  const image = result.images?.rows?.[0];
  if (!image) return null;
  const href = image.miniature?.href ?? image.tiny?.href ?? image.meta.downloadHref ?? image.meta.href;
  return `/api/moysklad/image?href=${encodeURIComponent(href)}`;
}

export function PromoManager() {
  const [items, setItems] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<"search" | "browse">("search");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Обзор каталога по разделам - альтернатива поиску, когда нужный товар не
  // находится текстовым поиском МойСклад (например, поиск "edon" не находит
  // товары этого бренда, потому что бренд не входит в индексируемые поля).
  // Здесь просто листаем каталог постранично, как на самом сайте.
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoaded, setFoldersLoaded] = useState(false);
  const [selectedFolderHref, setSelectedFolderHref] = useState<string | null>(null);
  const [browseRows, setBrowseRows] = useState<SearchResult[]>([]);
  const [browseTotal, setBrowseTotal] = useState(0);
  const [browseOffset, setBrowseOffset] = useState(0);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);

  const { roots: folderRoots, childrenByParent } = useMemo(() => buildFolderTree(folders), [folders]);

  useEffect(() => {
    if (tab !== "browse" || foldersLoaded) return;
    fetch("/api/moysklad/folders")
      .then((res) => res.json())
      .then((data) => setFolders(data.rows ?? []))
      .catch(() => undefined)
      .finally(() => setFoldersLoaded(true));
  }, [tab, foldersLoaded]);

  const loadBrowsePage = (folderHref: string | null, offset: number, append: boolean) => {
    setBrowseLoading(true);
    setBrowseError(null);
    const url = folderHref
      ? `/api/moysklad/by-folder?folderHref=${encodeURIComponent(folderHref)}&limit=${BROWSE_PAGE_SIZE}&offset=${offset}`
      : `/api/moysklad/assortment?limit=${BROWSE_PAGE_SIZE}&offset=${offset}`;
    fetch(url)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки каталога");
        setBrowseRows((current) => (append ? [...current, ...(data.rows ?? [])] : data.rows ?? []));
        setBrowseTotal(data.meta?.size ?? 0);
        setBrowseOffset(offset);
      })
      .catch((reason) => setBrowseError(reason instanceof Error ? reason.message : "Ошибка загрузки каталога"))
      .finally(() => setBrowseLoading(false));
  };

  useEffect(() => {
    if (tab !== "browse") return;
    loadBrowsePage(selectedFolderHref, 0, false);
  }, [tab, selectedFolderHref]);

  const loadItems = () => {
    setLoading(true);
    fetch("/api/admin/promo")
      .then(async (res) => {
        if (!res.ok) throw new Error("Ошибка загрузки списка акций");
        return res.json();
      })
      .then((data) => setItems(data.items ?? []))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/moysklad/assortment?search=${encodeURIComponent(trimmed)}&limit=15`);
        const data = await res.json();
        setResults(res.ok ? data.rows ?? [] : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const addProduct = async (productId: string) => {
    setAdding(productId);
    setError(null);
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка добавления");
      setQuery("");
      setResults([]);
      loadItems();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ошибка добавления");
    } finally {
      setAdding(null);
    }
  };

  const updateItem = async (id: string, patch: Partial<Pick<PromoItem, "oldPrice" | "active" | "sortOrder">>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    try {
      const res = await fetch(`/api/admin/promo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Ошибка сохранения");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ошибка сохранения");
      loadItems();
    }
  };

  const removeItem = async (item: PromoItem) => {
    if (!confirm(`Убрать «${item.productName ?? item.productId}» из акций?`)) return;
    const res = await fetch(`/api/admin/promo/${item.id}`, { method: "DELETE" });
    if (res.ok) setItems((current) => current.filter((entry) => entry.id !== item.id));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Акции</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Найдите товар из каталога МойСклад и добавьте его в блок «Акции» на главной и в
          каталоге. Актуальная цена, фото и наличие всегда берутся из МойСклад — здесь нужно
          только указать предыдущую (зачёркнутую) цену для скидки.
        </p>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setTab("search")}
            className={`px-4 py-2 text-sm font-semibold transition ${
              tab === "search" ? "border-b-2 border-amber-500 text-slate-900" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Поиск
          </button>
          <button
            type="button"
            onClick={() => setTab("browse")}
            className={`px-4 py-2 text-sm font-semibold transition ${
              tab === "browse" ? "border-b-2 border-amber-500 text-slate-900" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Весь каталог по разделам
          </button>
        </div>

        {tab === "search" && (
        <div className="relative mt-5">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Начните вводить название товара..."
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
          />
          {(searching || results.length > 0) && query.trim().length >= 2 && (
            <div className="absolute z-10 mt-1 w-full max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {searching && <p className="px-4 py-3 text-sm text-slate-400">Поиск...</p>}
              {!searching && results.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-400">Ничего не найдено</p>
              )}
              {!searching &&
                results.map((result) => {
                  const alreadyAdded = items.some((item) => item.productId === result.id);
                  const thumb = thumbnailUrl(result);
                  return (
                    <div key={result.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-50">
                        {thumb && <img src={thumb} alt={result.name} className="h-full w-full object-contain" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{result.name}</p>
                        <p className="text-xs text-slate-400">{formatRub(result.salePrices?.[0]?.value ?? null)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={alreadyAdded || adding === result.id}
                        onClick={() => addProduct(result.id)}
                        className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        {alreadyAdded ? "Добавлено" : adding === result.id ? "..." : "+ Добавить"}
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
        )}

        {tab === "browse" && (
          <div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="max-h-[420px] overflow-y-auto rounded-lg border border-slate-200 p-2">
              <button
                type="button"
                onClick={() => setSelectedFolderHref(null)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  selectedFolderHref === null ? "bg-amber-50 font-semibold text-amber-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Все товары
              </button>
              {!foldersLoaded && <p className="px-3 py-2 text-sm text-slate-400">Загрузка разделов...</p>}
              {folderRoots.map((root) => (
                <div key={root.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedFolderHref(root.meta.href)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                      selectedFolderHref === root.meta.href ? "bg-amber-50 font-semibold text-amber-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {root.name}
                  </button>
                  {(childrenByParent.get(root.meta.href) ?? []).map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setSelectedFolderHref(child.meta.href)}
                      className={`block w-full rounded-lg px-3 py-2 pl-6 text-left text-sm transition ${
                        selectedFolderHref === child.meta.href ? "bg-amber-50 font-semibold text-amber-700" : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-xs text-slate-400">
                {browseTotal > 0 ? `Показано ${browseRows.length} из ${browseTotal}` : browseLoading ? "Загрузка..." : "Товаров нет"}
              </p>
              {browseError && <p className="mb-2 text-sm text-red-600">{browseError}</p>}
              <div className="max-h-[420px] overflow-y-auto rounded-lg border border-slate-200">
                {browseRows.map((result) => {
                  const alreadyAdded = items.some((item) => item.productId === result.id);
                  const thumb = thumbnailUrl(result);
                  return (
                    <div key={result.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-50">
                        {thumb && <img src={thumb} alt={result.name} className="h-full w-full object-contain" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{result.name}</p>
                        <p className="text-xs text-slate-400">{formatRub(result.salePrices?.[0]?.value ?? null)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={alreadyAdded || adding === result.id}
                        onClick={() => addProduct(result.id)}
                        className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        {alreadyAdded ? "Добавлено" : adding === result.id ? "..." : "+ Добавить"}
                      </button>
                    </div>
                  );
                })}
                {!browseLoading && browseRows.length === 0 && (
                  <p className="px-4 py-3 text-sm text-slate-400">В этом разделе нет товаров</p>
                )}
              </div>
              {browseRows.length < browseTotal && (
                <button
                  type="button"
                  disabled={browseLoading}
                  onClick={() => loadBrowsePage(selectedFolderHref, browseOffset + BROWSE_PAGE_SIZE, true)}
                  className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition hover:border-amber-300 hover:text-amber-700 disabled:opacity-50"
                >
                  {browseLoading ? "Загрузка..." : "Показать ещё"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Товары в акции ({items.length})</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Загрузка...</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Пока ни один товар не добавлен в акции</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3">Товар</th>
                  <th className="py-2 pr-3">Текущая цена</th>
                  <th className="py-2 pr-3">Старая цена, ₽</th>
                  <th className="py-2 pr-3">Порядок</th>
                  <th className="py-2 pr-3">Активна</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3 pr-3">
                      {item.productMissing ? (
                        <span className="text-red-500">Товар не найден в МойСклад</span>
                      ) : (
                        <span className="font-medium text-slate-800">{item.productName}</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-slate-600">{formatRub(item.productPrice)}</td>
                    <td className="py-3 pr-3">
                      <input
                        type="number"
                        min={0}
                        step="1"
                        defaultValue={item.oldPrice ?? ""}
                        onBlur={(event) => {
                          const value = event.target.value;
                          updateItem(item.id, { oldPrice: value === "" ? null : Number(value) });
                        }}
                        className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-amber-400"
                      />
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        type="number"
                        defaultValue={item.sortOrder}
                        onBlur={(event) => updateItem(item.id, { sortOrder: Number(event.target.value) })}
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-amber-400"
                      />
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        type="checkbox"
                        checked={item.active}
                        onChange={(event) => updateItem(item.id, { active: event.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <button type="button" onClick={() => removeItem(item)} className="text-xs font-semibold text-red-600 hover:text-red-800">
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
