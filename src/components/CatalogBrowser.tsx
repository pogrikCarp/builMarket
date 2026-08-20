"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProductCartControl from "@/components/cart/ProductCartControl";
import ProductFavoriteToggle from "@/components/favorites/ProductFavoriteToggle";
import type { MoyskladAssortmentItem, MoyskladProductFolder } from "@/lib/moysklad";
import { formatAttributeValue, getItemGalleryThumbnailUrls } from "@/lib/moysklad-format";
import { buildFolderTree, getFolderPath } from "@/lib/folder-tree";
import { PROMO_PRODUCTS } from "@/lib/promo-products";
import ProductCardMedia from "@/components/catalog/ProductCardMedia";

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

type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortOption, string> = {
  "name-asc": "По алфавиту (А-Я)",
  "name-desc": "По алфавиту (Я-А)",
  "price-asc": "По цене (сначала дешевле)",
  "price-desc": "По цене (сначала дороже)",
};

type Props = {
  folders: MoyskladProductFolder[];
  initialItems: MoyskladAssortmentItem[];
  initialFolderId?: string;
  initialSection?: "all" | "promo";
  initialSearch?: string;
  initialSort?: string;
  initialOnlyInStock?: boolean;
  initialPriceFrom?: string;
  initialPriceTo?: string;
};

const isSortOption = (value?: string): value is SortOption =>
  value === "name-asc" || value === "name-desc" || value === "price-asc" || value === "price-desc";

// Формирует адрес /catalog с параметрами текущего просмотра (раздел, поиск, сортировка, фильтры),
// чтобы кнопка "назад" браузера после открытия карточки товара возвращала туда же, откуда ушли.
function buildCatalogUrl(state: {
  section: CatalogSection;
  folderId: string | null;
  search: string;
  sort: SortOption;
  inStock: boolean;
  priceFrom: string;
  priceTo: string;
}): string {
  const params = new URLSearchParams();
  const trimmedSearch = state.search.trim();

  if (trimmedSearch) {
    params.set("q", trimmedSearch);
  } else if (state.section === "promo") {
    params.set("section", "promo");
  } else if (state.section === "folder" && state.folderId) {
    params.set("folder", state.folderId);
  }

  if (state.sort !== "name-asc") params.set("sort", state.sort);
  if (state.inStock) params.set("stock", "1");
  if (state.priceFrom) params.set("priceFrom", state.priceFrom);
  if (state.priceTo) params.set("priceTo", state.priceTo);

  const query = params.toString();
  return `/catalog${query ? `?${query}` : ""}`;
}

export default function CatalogBrowser({
  folders,
  initialItems,
  initialFolderId,
  initialSection = "all",
  initialSearch = "",
  initialSort,
  initialOnlyInStock = false,
  initialPriceFrom = "",
  initialPriceTo = "",
}: Props) {
  const initialFolder = useMemo(
    () => (initialFolderId ? folders.find((folder) => folder.id === initialFolderId) ?? null : null),
    [folders, initialFolderId]
  );
  const { roots: rootFolders, childrenByParent } = useMemo(() => buildFolderTree(folders), [folders]);
  const [activeFolder, setActiveFolder] = useState<MoyskladProductFolder | null>(initialFolder);
  // Полная цепочка предков активной папки (раздел → категория → подкатегория...) —
  // нужна, чтобы на любом уровне вложенности подсвечивать и раскрывать правильный путь,
  // а не только раздел + один уровень подкатегорий.
  const activePath = useMemo(
    () => (activeFolder ? getFolderPath(activeFolder, folders) : []),
    [activeFolder, folders]
  );
  const [activeSection, setActiveSection] = useState<CatalogSection>(
    initialFolder ? "folder" : initialSection
  );
  const [allItems, setAllItems] = useState<MoyskladAssortmentItem[]>(initialFolder ? [] : initialItems);
  const [items, setItems] = useState<MoyskladAssortmentItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortOption, setSortOption] = useState<SortOption>(isSortOption(initialSort) ? initialSort : "name-asc");
  const [onlyInStock, setOnlyInStock] = useState(initialOnlyInStock);
  const [priceFrom, setPriceFrom] = useState(initialPriceFrom);
  const [priceTo, setPriceTo] = useState(initialPriceTo);
  const [attributeFilters, setAttributeFilters] = useState<Record<string, Set<string>>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Держим адрес страницы в соответствии с выбранным разделом, поиском и фильтрами.
  // Благодаря этому кнопка "назад" браузера после перехода в карточку товара
  // возвращает пользователя туда же, где он был, а не в начало каталога.
  useEffect(() => {
    const url = buildCatalogUrl({
      section: activeSection,
      folderId: activeFolder?.id ?? null,
      search: searchQuery,
      sort: sortOption,
      inStock: onlyInStock,
      priceFrom,
      priceTo,
    });
    window.history.replaceState(null, "", url);
  }, [activeSection, activeFolder, searchQuery, sortOption, onlyInStock, priceFrom, priceTo]);

  // Набор характеристик (атрибутов МойСклад) зависит от раздела - при переключении
  // раздела старые выбранные значения могли перестать существовать, поэтому сбрасываем
  // их прямо во время рендера, как только видим новый массив items (см. "Adjusting
  // state when a prop changes" в документации React).
  const [previousItemsForFilters, setPreviousItemsForFilters] = useState(items);
  if (items !== previousItemsForFilters) {
    setPreviousItemsForFilters(items);
    setAttributeFilters({});
  }

  const availableAttributeFacets = useMemo(() => {
    const facets = new Map<string, Set<string>>();
    for (const item of items) {
      for (const attribute of item.attributes ?? []) {
        const value = formatAttributeValue(attribute.value);
        if (!value) continue;
        if (!facets.has(attribute.name)) facets.set(attribute.name, new Set());
        facets.get(attribute.name)!.add(value);
      }
    }
    return Array.from(facets.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values).sort((a, b) => a.localeCompare(b, "ru")),
    }));
  }, [items]);

  const toggleAttributeFilter = (attributeName: string, value: string) => {
    setAttributeFilters((prev) => {
      const next = { ...prev };
      const current = new Set(next[attributeName] ?? []);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      if (current.size === 0) {
        delete next[attributeName];
      } else {
        next[attributeName] = current;
      }
      return next;
    });
  };

  const activeFilterCount =
    Object.values(attributeFilters).reduce((sum, values) => sum + values.size, 0) +
    (onlyInStock ? 1 : 0) +
    (priceFrom ? 1 : 0) +
    (priceTo ? 1 : 0);

  const resetFilters = () => {
    setAttributeFilters({});
    setOnlyInStock(false);
    setPriceFrom("");
    setPriceTo("");
    setSearchQuery("");
  };

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const minPrice = priceFrom ? Number(priceFrom) * 100 : null;
    const maxPrice = priceTo ? Number(priceTo) * 100 : null;

    const filtered = items.filter((item) => {
      if (query) {
        const haystack = `${item.name} ${item.article ?? ""} ${item.code ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (onlyInStock && !(item.quantity && item.quantity > 0)) return false;

      const price = item.salePrices?.[0]?.value;
      if (minPrice != null && (price == null || price < minPrice)) return false;
      if (maxPrice != null && (price == null || price > maxPrice)) return false;

      for (const [attributeName, allowedValues] of Object.entries(attributeFilters)) {
        if (allowedValues.size === 0) continue;
        const itemValue = item.attributes
          ?.filter((attribute) => attribute.name === attributeName)
          .map((attribute) => formatAttributeValue(attribute.value))
          .find(Boolean);
        if (!itemValue || !allowedValues.has(itemValue)) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "name-desc":
          return b.name.localeCompare(a.name, "ru");
        case "price-asc":
          return (a.salePrices?.[0]?.value ?? Infinity) - (b.salePrices?.[0]?.value ?? Infinity);
        case "price-desc":
          return (b.salePrices?.[0]?.value ?? -Infinity) - (a.salePrices?.[0]?.value ?? -Infinity);
        case "name-asc":
        default:
          return a.name.localeCompare(b.name, "ru");
      }
    });

    return sorted;
  }, [items, searchQuery, sortOption, onlyInStock, priceFrom, priceTo, attributeFilters]);

  // Рекурсивный список подкатегорий для десктопного сайдбара — раскрыт всегда, поддерживает
  // любую глубину вложенности (в МойСклад встречаются папки на 3 уровня: раздел → категория → подкатегория).
  const renderFolderChildren = (parentHref: string, depth: number) => {
    const children = childrenByParent.get(parentHref) ?? [];
    if (children.length === 0) return null;
    return (
      <ul className="border-l border-slate-100 pb-1 pl-4">
        {children.map((child) => (
          <li key={child.id}>
            <button
              type="button"
              onClick={() => handleFolderClick(child)}
              className={`flex w-full items-center gap-2 py-2 pl-4 pr-2 text-left text-[13px] transition ${
                activeSection === "folder" && activeFolder?.id === child.id
                  ? "font-semibold text-amber-700"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />
              <span className="leading-tight">{child.name}</span>
            </button>
            {renderFolderChildren(child.meta.href, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex min-h-[400px] flex-col md:flex-row md:gap-0">
      {/* Sidebar групп — горизонтальный скролл на мобильных, вертикальный на md+ */}
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white md:w-56 md:border-b-0 md:border-r lg:w-64">
        {/* Мобильный вид: горизонтальные кнопки-чипы, подкатегории раскрываются под выбранным разделом */}
        <div className="border-b border-slate-100 md:hidden">
          <div className="flex gap-2 overflow-x-auto px-3 py-3">
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
            {rootFolders.map((folder) => {
              const children = childrenByParent.get(folder.meta.href) ?? [];
              const isActiveRoot = activeSection === "folder" && activePath[0]?.id === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => handleFolderClick(folder)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    isActiveRoot ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {folder.name}
                  {children.length > 0 && <span className="ml-1 opacity-70">▾</span>}
                </button>
              );
            })}
          </div>
          {/* Дополнительные ряды чипов на каждый уровень вложенности активного пути —
              так подкатегории любой глубины (раздел → категория → подкатегория) остаются доступны. */}
          {activePath.map((node, level) => {
            const children = childrenByParent.get(node.meta.href) ?? [];
            if (children.length === 0) return null;
            return (
              <div key={node.id} className="flex gap-2 overflow-x-auto border-t border-slate-100 bg-slate-50 px-3 py-2.5">
                {children.map((child) => {
                  const childChildren = childrenByParent.get(child.meta.href) ?? [];
                  const isActiveChild = activeSection === "folder" && activePath[level + 1]?.id === child.id;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => handleFolderClick(child)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                        isActiveChild
                          ? "bg-amber-500 text-white"
                          : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200"
                      }`}
                    >
                      {child.name}
                      {childChildren.length > 0 && <span className="ml-1 opacity-70">▾</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
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
            {rootFolders.map((folder) => (
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
                {renderFolderChildren(folder.meta.href, 1)}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Область товаров */}
      <div className="flex-1 bg-stone-50 p-3 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {activeSection === "promo" ? "Акции" : activeFolder ? activeFolder.name : "Все товары"}
            </h2>
            <p className="text-sm text-slate-400">
              {loading
                ? "Загрузка..."
                : `${activeSection === "promo" ? PROMO_PRODUCTS.length : visibleItems.length} товаров`}
            </p>
          </div>
          {loading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          )}
        </div>

        {activeSection !== "promo" && (
          <div className="mb-5 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Поиск по названию, артикулу..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-amber-400"
                />
              </div>
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400"
              >
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setFiltersOpen((prev) => !prev)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  filtersOpen || activeFilterCount > 0
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 12h12M10 19h4" />
                </svg>
                Фильтр
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {filtersOpen && (
              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:gap-6">
                <div className="min-w-[160px]">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Цена, ₽</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={priceFrom}
                      onChange={(event) => setPriceFrom(event.target.value)}
                      placeholder="От"
                      className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-amber-400"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="number"
                      min={0}
                      value={priceTo}
                      onChange={(event) => setPriceTo(event.target.value)}
                      placeholder="До"
                      className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="min-w-[160px]">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Наличие</p>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={onlyInStock}
                      onChange={(event) => setOnlyInStock(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    />
                    Только в наличии
                  </label>
                </div>

                {availableAttributeFacets.map((facet) => (
                  <div key={facet.name} className="min-w-[160px]">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{facet.name}</p>
                    <div className="flex max-h-32 flex-col gap-1.5 overflow-y-auto pr-1">
                      {facet.values.map((value) => (
                        <label key={value} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={attributeFilters[facet.name]?.has(value) ?? false}
                            onChange={() => toggleAttributeFilter(facet.name, value)}
                            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                          />
                          {value}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="self-start text-sm font-semibold text-amber-600 hover:text-amber-700 sm:ml-auto sm:self-end"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>
            )}
          </div>
        )}

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
                  <a href="tel:+79160045522" className="mt-4 rounded-lg bg-amber-500 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-amber-600">
                    Заказать
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {visibleItems.length === 0 && !loading && (
              <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <p className="text-sm text-slate-400">
                  {items.length === 0 ? "Товаров в этой группе нет" : "Ничего не найдено по заданным условиям"}
                </p>
              </div>
            )}

            <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}>
              {visibleItems.map((item) => {
                const price = item.salePrices?.[0]?.value;
                const groupLabel = getGroupLabel(item.productFolder);
                const subgroupLabel = getSubgroupLabel(item.productFolder);
                const galleryUrls = getItemGalleryThumbnailUrls(item);
                return (
                  <Link
                    key={item.id}
                    href={`/catalog/${item.id}?type=${item.meta.type}`}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md"
                  >
                    <div>
                      <div className="relative mb-4 overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 via-white to-slate-200">
                        <ProductFavoriteToggle
                          item={item}
                          imageUrl={galleryUrls[0] ?? null}
                          size="sm"
                          className="absolute right-2 top-2 z-10"
                        />
                        <div className="relative aspect-[4/3] w-full">
                          <ProductCardMedia images={galleryUrls} alt={item.name} />
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
                      <ProductCartControl item={item} size="sm" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
