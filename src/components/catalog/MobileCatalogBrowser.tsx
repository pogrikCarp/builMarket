"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProductCartControl from "@/components/cart/ProductCartControl";
import ProductFavoriteToggle from "@/components/favorites/ProductFavoriteToggle";
import type { MoyskladProductFolder } from "@/lib/moysklad";
import { getItemGalleryThumbnailUrls, type CatalogListItem } from "@/lib/moysklad-format";
import { buildFolderTree, getFolderPath } from "@/lib/folder-tree";
import type { ResolvedPromoItem } from "@/lib/promo";
import ProductCardMedia from "@/components/catalog/ProductCardMedia";
import { CatalogDirectory } from "@/components/catalog/CatalogNavigation";
import CatalogFilterDialog from "@/components/catalog/CatalogFilterDialog";
import { ChevronRightIcon, MagnifyingGlassIcon, Squares2X2Icon, AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import styles from "@/components/catalog/Catalog.module.css";
import {
  CATALOG_SORT_LABELS as SORT_LABELS,
  DEFAULT_CATALOG_SORT,
  sortCatalogItems,
  isCatalogSortOption as isSortOption,
  type CatalogSortOption as SortOption,
} from "@/lib/catalog-sort";

function formatPrice(value?: number) {
  if (value == null) return null;
  return (value / 100).toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });
}

function formatProductCount(count: number) {
  const plural = new Intl.PluralRules("ru").select(count);
  const noun = plural === "one" ? "товар" : plural === "few" ? "товара" : "товаров";
  return `${count.toLocaleString("ru-RU")} ${noun}`;
}

type CatalogSection = "all" | "promo" | "folder";

const PRODUCTS_PER_PAGE = 50;

type PaginationItem = number | "start-ellipsis" | "end-ellipsis";

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 4) [2, 3, 4, 5].forEach((page) => pages.add(page));
  if (currentPage >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => pages.add(page));
  }

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const result: PaginationItem[] = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];
    if (previousPage && page - previousPage > 1) {
      result.push(previousPage === 1 ? "start-ellipsis" : "end-ellipsis");
    }
    result.push(page);
  });

  return result;
}

type Props = {
  folders: MoyskladProductFolder[];
  initialItems: CatalogListItem[];
  initialFolderId?: string;
  initialSection?: "all" | "promo";
  initialSearch?: string;
  initialSort?: string;
  initialOnlyInStock?: boolean;
  initialPriceFrom?: string;
  initialPriceTo?: string;
  initialPage?: number;
  initialView?: "products";
  initialPromoItems?: ResolvedPromoItem[];
};

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
  page: number;
  showProducts?: boolean;
}): string {
  const params = new URLSearchParams();
  const trimmedSearch = state.search.trim();

  if (trimmedSearch) {
    params.set("q", trimmedSearch);
  } else if (state.section === "promo") {
    params.set("section", "promo");
  } else if (state.section === "folder" && state.folderId) {
    params.set("folder", state.folderId);
  } else if (state.showProducts) {
    params.set("view", "products");
  }

  if (state.sort !== DEFAULT_CATALOG_SORT) params.set("sort", state.sort);
  if (state.inStock) params.set("stock", "1");
  if (state.priceFrom) params.set("priceFrom", state.priceFrom);
  if (state.priceTo) params.set("priceTo", state.priceTo);
  if (state.page > 1) params.set("page", String(state.page));

  const query = params.toString();
  return `/catalog${query ? `?${query}` : ""}`;
}

export default function MobileCatalogBrowser({
  folders,
  initialItems,
  initialFolderId,
  initialSection = "all",
  initialSearch = "",
  initialSort,
  initialOnlyInStock = false,
  initialPriceFrom = "",
  initialPriceTo = "",
  initialPage = 1,
  initialView,
  initialPromoItems = [],
}: Props) {
  const initialFolder = useMemo(
    () => (initialFolderId ? folders.find((folder) => folder.id === initialFolderId) ?? null : null),
    [folders, initialFolderId]
  );
  const { childrenByParent } = useMemo(() => buildFolderTree(folders), [folders]);
  const [activeFolder, setActiveFolder] = useState<MoyskladProductFolder | null>(initialFolder);
  const initialDirectoryOpen = !initialFolder && initialSection === "all" && !initialSearch &&
    !initialOnlyInStock && !initialPriceFrom && !initialPriceTo &&
    (!initialSort || initialSort === DEFAULT_CATALOG_SORT) && initialPage === 1 && initialView !== "products";
  const [directoryOpen, setDirectoryOpen] = useState(initialDirectoryOpen);
  const [navigationFolder, setNavigationFolder] = useState<MoyskladProductFolder | null>(null);
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
  const [allItems, setAllItems] = useState<CatalogListItem[]>(initialFolder ? [] : initialItems);
  const [items, setItems] = useState<CatalogListItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [previousInitialItems, setPreviousInitialItems] = useState(initialItems);
  const abortRef = useRef<AbortController | null>(null);

  // При возвращении/переходе Next.js передаёт свежий локальный рейтинг. Принимаем
  // его, сохраняя выбранные фильтры и страницу; данные чужого раздела не подмешиваем.
  if (initialItems !== previousInitialItems) {
    setPreviousInitialItems(initialItems);
    if (!loading && activeSection !== "promo" && initialFolder?.id === activeFolder?.id) {
      setItems(initialItems);
      if (!initialFolder) setAllItems(initialItems);
    }
  }

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortOption, setSortOption] = useState<SortOption>(isSortOption(initialSort) ? initialSort : DEFAULT_CATALOG_SORT);
  const [onlyInStock, setOnlyInStock] = useState(initialOnlyInStock);
  const [priceFrom, setPriceFrom] = useState(initialPriceFrom);
  const [priceTo, setPriceTo] = useState(initialPriceTo);
  const [attributeFilters, setAttributeFilters] = useState<Record<string, Set<string>>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [previousInitialPage, setPreviousInitialPage] = useState(initialPage);
  const catalogTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!header) return;
    const updateHeaderHeight = () => catalogTopRef.current?.style.setProperty("--catalog-header-height", `${header.getBoundingClientRect().height}px`);
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // Header links can change the section/search while Next.js keeps this client
  // component mounted. Accept that navigation without resetting filters when
  // the incoming URL merely confirms our own debounced router.replace.
  const incomingUrl = buildCatalogUrl({
    section: initialFolder ? "folder" : initialSection,
    folderId: initialFolder?.id ?? null,
    search: initialSearch,
    sort: isSortOption(initialSort) ? initialSort : DEFAULT_CATALOG_SORT,
    inStock: initialOnlyInStock,
    priceFrom: initialPriceFrom,
    priceTo: initialPriceTo,
    page: initialPage,
    showProducts: initialView === "products",
  });
  const [previousSelection, setPreviousSelection] = useState(incomingUrl);
  const [synchronizedUrl, setSynchronizedUrl] = useState<string | null>(null);
  if (incomingUrl !== previousSelection) {
    setPreviousSelection(incomingUrl);
    setSynchronizedUrl(null);
    const nextSection = initialFolder ? "folder" : initialSection;
    if (incomingUrl !== synchronizedUrl) {
      if (activeSection !== nextSection || activeFolder?.id !== initialFolder?.id || searchQuery !== initialSearch) setAttributeFilters({});
      setDirectoryOpen(initialDirectoryOpen);
      setNavigationFolder(null);
      setActiveSection(nextSection);
      setActiveFolder(initialFolder);
      setSearchQuery(initialSearch);
      setSortOption(isSortOption(initialSort) ? initialSort : DEFAULT_CATALOG_SORT);
      setOnlyInStock(initialOnlyInStock);
      setPriceFrom(initialPriceFrom);
      setPriceTo(initialPriceTo);
      setItems(initialItems);
      if (!initialFolder) setAllItems(initialItems);
      setLoading(false);
      setCurrentPage(initialPage);
    }
  }

  useEffect(() => {
    // An external navigation supersedes any pending request for the old folder.
    if (!loading) abortRef.current?.abort();
  }, [incomingUrl, loading]);

  if (initialPage !== previousInitialPage) {
    setPreviousInitialPage(initialPage);
    setCurrentPage(initialPage);
  }

  const loadByFolder = useCallback(async (folder: MoyskladProductFolder) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/moysklad/by-folder?folderHref=${encodeURIComponent(folder.meta.href)}&limit=1000&slim=1`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      if (controller.signal.aborted) return;
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
      const res = await fetch(`/api/moysklad/assortment?limit=1000&slim=1`, { signal: controller.signal });
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      if (controller.signal.aborted) return;
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
    setDirectoryOpen(false);
    setSearchQuery("");
    setCurrentPage(1);
    setActiveSection("folder");
    setActiveFolder(folder);
    loadByFolder(folder);
  };


  const handleShowAll = () => {
    setDirectoryOpen(false);
    setSearchQuery("");
    setCurrentPage(1);
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
    setDirectoryOpen(false);
    setSearchQuery("");
    setCurrentPage(1);
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

  // Держим адрес страницы в соответствии с выбранным разделом, поиском и фильтрами,
  // используя именно router.replace (а не "тихую" history.replaceState) — Next.js
  // кэширует RSC-пейлоад для текущей записи истории и именно его переиспользует при
  // нажатии "назад" в браузере. Если не обновлять URL через сам роутер, кнопка "назад"
  // покажет тот пейлоад, что был закэширован при первом заходе на /catalog (то есть
  // "все товары"), полностью игнорируя выбранный раздел и фильтры.
  const router = useRouter();
  const isFirstUrlSyncRef = useRef(true);
  useEffect(() => {
    const url = buildCatalogUrl({
      section: activeSection,
      folderId: activeFolder?.id ?? null,
      search: searchQuery,
      sort: sortOption,
      inStock: onlyInStock,
      priceFrom,
      priceTo,
      page: currentPage,
      showProducts: !directoryOpen,
    });

    // На самом первом рендере адрес уже соответствует переданным initial*-пропсам —
    // не нужно сразу же дёргать роутер повторным запросом.
    if (isFirstUrlSyncRef.current) {
      isFirstUrlSyncRef.current = false;
      return;
    }
    // A header navigation already supplied this URL. Replacing it again after
    // the debounce could overwrite a subsequent click on another header link.
    if (url === incomingUrl) return;

    const timeoutId = window.setTimeout(() => {
      setSynchronizedUrl(url);
      router.replace(url, { scroll: false });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [activeSection, activeFolder, searchQuery, sortOption, onlyInStock, priceFrom, priceTo, currentPage, directoryOpen, router, incomingUrl]);

  // Фильтры характеристик сбрасываем только при смене раздела, а не при
  // обновлении статистики/цен того же списка или смене страницы.
  const filterContext = `${activeSection}:${activeFolder?.id ?? ""}`;
  const [previousFilterContext, setPreviousFilterContext] = useState(filterContext);
  if (filterContext !== previousFilterContext) {
    setPreviousFilterContext(filterContext);
    setAttributeFilters({});
  }

  const availableAttributeFacets = useMemo(() => {
    const facets = new Map<string, Set<string>>();
    for (const item of items) {
      for (const attribute of item.attributes) {
        if (!facets.has(attribute.name)) facets.set(attribute.name, new Set());
        facets.get(attribute.name)!.add(attribute.value);
      }
    }
    return Array.from(facets.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values).sort((a, b) => a.localeCompare(b, "ru")),
    }));
  }, [items]);

  const toggleAttributeFilter = (attributeName: string, value: string) => {
    setCurrentPage(1);
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
    setCurrentPage(1);
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
        const attributeValues = item.attributes.map((attribute) => attribute.value).join(" ");
        const haystack = `${item.name} ${item.article ?? ""} ${item.code ?? ""} ${attributeValues}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (onlyInStock && !(item.quantity && item.quantity > 0)) return false;

      const price = item.salePrices?.[0]?.value;
      if (minPrice != null && (price == null || price < minPrice)) return false;
      if (maxPrice != null && (price == null || price > maxPrice)) return false;

      for (const [attributeName, allowedValues] of Object.entries(attributeFilters)) {
        if (allowedValues.size === 0) continue;
        const itemValue = item.attributes.find((attribute) => attribute.name === attributeName)?.value;
        if (!itemValue || !allowedValues.has(itemValue)) return false;
      }

      return true;
    });

    const sorted = sortCatalogItems(filtered, sortOption);

    return sorted;
  }, [items, searchQuery, sortOption, onlyInStock, priceFrom, priceTo, attributeFilters]);

  const paginatedItemCount = activeSection === "promo" ? initialPromoItems.length : visibleItems.length;
  const totalPages = Math.max(1, Math.ceil(paginatedItemCount / PRODUCTS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  if (safeCurrentPage !== currentPage) {
    setCurrentPage(safeCurrentPage);
  }

  const pageStartIndex = (safeCurrentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedItems = useMemo(
    () => visibleItems.slice(pageStartIndex, pageStartIndex + PRODUCTS_PER_PAGE),
    [visibleItems, pageStartIndex]
  );
  const paginatedPromoItems = useMemo(
    () => initialPromoItems.slice(pageStartIndex, pageStartIndex + PRODUCTS_PER_PAGE),
    [initialPromoItems, pageStartIndex]
  );

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === safeCurrentPage) return;
    setCurrentPage(nextPage);
    window.requestAnimationFrame(() => {
      catalogTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const getPageUrl = (page: number) => buildCatalogUrl({
    section: activeSection,
    folderId: activeFolder?.id ?? null,
    search: searchQuery,
    sort: sortOption,
    inStock: onlyInStock,
    priceFrom,
    priceTo,
    page,
    showProducts: !directoryOpen,
  });

  const openDirectory = (folder: MoyskladProductFolder | null) => {
    setNavigationFolder(folder);
    setDirectoryOpen(true);
    setFiltersOpen(false);
    window.requestAnimationFrame(() => catalogTopRef.current?.scrollIntoView({ block: "start" }));
  };
  const navigationProps = {
    folders, navigationFolder,
    onBrowse: openDirectory, onSelect: handleFolderClick,
    onAll: handleShowAll, onPromo: handleShowPromo,
  };
  const subcategories = activeFolder ? childrenByParent.get(activeFolder.meta.href) ?? [] : [];

  return (
    <div ref={catalogTopRef} className={styles.catalog}>
      <nav className={styles.breadcrumbs} aria-label="Путь по каталогу">
        <Link href="/">Главная</Link><ChevronRightIcon className={styles.chevron} aria-hidden="true" />
        <button type="button" onClick={() => openDirectory(null)}>Каталог</button>
        {!directoryOpen && activePath.map((folder) => <span key={folder.id} className="contents">
          <ChevronRightIcon className={styles.chevron} aria-hidden="true" />
          <button type="button" onClick={() => openDirectory(folder)}>{folder.name}</button>
        </span>)}
      </nav>
      <div className={styles.heading}>
        <h1>{directoryOpen ? "Каталог товаров" : searchQuery.trim() ? `Поиск: ${searchQuery.trim()}` : activeSection === "promo" ? "Акции" : activeFolder?.name ?? "Все товары"}</h1>
        <form role="search" className={styles.search} onSubmit={(event) => event.preventDefault()}>
          <MagnifyingGlassIcon className={styles.icon} aria-hidden="true" />
          <input type="search" aria-label="Поиск в каталоге" value={directoryOpen ? "" : searchQuery} placeholder="Название, артикул или код товара"
            onChange={(event) => {
              const value = event.target.value;
              if (value.trim() && activeSection !== "all") handleShowAll();
              setCurrentPage(1);
              setSearchQuery(value);
              if (value.trim()) setDirectoryOpen(false);
            }} />
          {!directoryOpen && searchQuery && <button type="button" aria-label="Очистить поиск" onClick={() => { setSearchQuery(""); setCurrentPage(1); }}>
            <XMarkIcon className={styles.icon} aria-hidden="true" />
          </button>}
        </form>
      </div>
      <div className={styles.layout}>
        {directoryOpen ? <CatalogDirectory {...navigationProps} /> : (
      <div className={styles.products}>
        <div className={styles.productsHeader}>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {activeSection === "promo" ? "Акционные товары" : "Товары"}
            </h2>
            <p aria-live="polite">
              {loading
                ? "Загрузка..."
                : formatProductCount(activeSection === "promo" ? initialPromoItems.length : visibleItems.length)}
            </p>
          </div>
          {loading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          )}
          <button type="button" className={styles.categoriesButton} onClick={() => openDirectory(activePath[0] ?? null)}>
            <Squares2X2Icon className={styles.icon} aria-hidden="true" />Категории
          </button>
        </div>

        {subcategories.length > 0 && <nav className={styles.subcategories} aria-label="Подкатегории выбранного раздела">
          {subcategories.map((folder) => <Link key={folder.id} href={`/catalog?folder=${folder.id}`} prefetch={false}
            onNavigate={(event) => { event.preventDefault(); handleFolderClick(folder); }}>{folder.name}</Link>)}
        </nav>}
        {activeSection !== "promo" && <>
          <div className={styles.toolbar}>
            <label className={styles.sortLabel}>
              <span>Сортировать:</span>
              <select aria-label="Сортировка товаров" value={sortOption}
                onChange={(event) => { setCurrentPage(1); setSortOption(event.target.value as SortOption); }}>
                {Object.entries(SORT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button type="button" className={styles.filterButton} aria-expanded={filtersOpen} aria-haspopup="dialog"
              data-active={activeFilterCount > 0} onClick={() => setFiltersOpen(true)}>
              <AdjustmentsHorizontalIcon className={styles.icon} aria-hidden="true" />Фильтры
              {activeFilterCount > 0 && <span className={styles.filterCount}>{activeFilterCount}</span>}
            </button>
          </div>
          {activeFilterCount > 0 && <div className={styles.filterSummary}>
            <span>Применено фильтров: {activeFilterCount}</span>
            <button type="button" onClick={resetFilters}>Сбросить</button>
          </div>}
          <CatalogFilterDialog open={filtersOpen} onClose={() => setFiltersOpen(false)} count={visibleItems.length}>
            <div className="flex flex-col gap-6">
                <div className="min-w-[160px]">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Цена, ₽</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={priceFrom}
                      onChange={(event) => {
                        setCurrentPage(1);
                        setPriceFrom(event.target.value);
                      }}
                      aria-label="Цена от"
                      placeholder="От"
                      className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-amber-400"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="number"
                      min={0}
                      value={priceTo}
                      onChange={(event) => {
                        setCurrentPage(1);
                        setPriceTo(event.target.value);
                      }}
                      aria-label="Цена до"
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
                      onChange={(event) => {
                        setCurrentPage(1);
                        setOnlyInStock(event.target.checked);
                      }}
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
          </CatalogFilterDialog>
        </>}

        {activeSection === "promo" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {initialPromoItems.length === 0 && !loading && (
              <div className="col-span-full flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <p className="text-sm text-slate-400">Пока нет активных акций</p>
              </div>
            )}
            {paginatedPromoItems.map(({ promoId, item, oldPrice, discount }) => {
              const price = item.salePrices?.[0]?.value;
              const galleryUrls = getItemGalleryThumbnailUrls(item);
              return (
                <Link
                  key={promoId}
                  href={`/catalog/${item.id}`}
                  prefetch={false}
                  className="flex flex-col justify-between overflow-hidden rounded-xl border border-amber-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div>
                    <div className="relative mb-4 overflow-hidden rounded-lg bg-white">
                      <ProductFavoriteToggle item={item} imageUrl={galleryUrls[0] ?? null} size="sm" className="absolute right-2 top-2 z-10" />
                      {discount != null && (
                        <span className="absolute left-2 top-2 z-10 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow">−{discount}%</span>
                      )}
                      <div className="relative aspect-[4/3] w-full">
                        <ProductCardMedia images={galleryUrls} alt={item.name} />
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-600">Акция</p>
                    <p className="mt-1 font-semibold leading-snug text-slate-900">{item.name}</p>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        {formatPrice(price) && <p className="text-base font-bold text-amber-600">{formatPrice(price)}</p>}
                        {oldPrice != null && <p className="text-xs text-slate-400 line-through">{formatPrice(oldPrice)}</p>}
                      </div>
                      {item.quantity != null && <p className="text-xs text-slate-500">В наличии: {item.quantity}</p>}
                    </div>
                    <ProductCartControl item={item} size="sm" />
                  </div>
                </Link>
              );
            })}
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
              {paginatedItems.map((item) => {
                const price = item.salePrices?.[0]?.value;
                const groupLabel = item.groupLabel;
                const subgroupLabel = item.subgroupLabel;
                const galleryUrls = item.galleryThumbnails;
                return (
                  <Link
                    key={item.id}
                    href={`/catalog/${item.id}`}
                    // В каталоге одновременно видно/рядом много карточек - без prefetch={false}
                    // Next.js тихо предзагружал бы карточку товара (и, соответственно, запрос
                    // к МойСклад) для каждой из них, что и приводило к перегрузке лимита API.
                    prefetch={false}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md"
                  >
                    <div>
                      <div className="relative mb-4 overflow-hidden rounded-lg bg-white">
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

        {totalPages > 1 && (
          <nav aria-label="Навигация по страницам каталога" className="mt-8 flex flex-col items-center gap-3">
            <p className="text-xs text-slate-500">
              Товары {pageStartIndex + 1}–
              {Math.min(pageStartIndex + PRODUCTS_PER_PAGE, paginatedItemCount)} из {paginatedItemCount}
            </p>
            <div className="flex max-w-full items-center justify-center gap-2">
              {safeCurrentPage === 1 ? (
                <span aria-label="Предыдущая страница" aria-disabled="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 opacity-40">
                  <span aria-hidden="true">←</span>
                </span>
              ) : (
                <Link
                  href={getPageUrl(safeCurrentPage - 1)}
                  prefetch={false}
                  rel="prev"
                  onNavigate={(event) => {
                    event.preventDefault();
                    handlePageChange(safeCurrentPage - 1);
                  }}
                  aria-label="Предыдущая страница"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-amber-300 hover:text-amber-600"
                >
                  <span aria-hidden="true">←</span>
                </Link>
              )}
              <div className="hidden items-center gap-2 sm:flex">
                {getPaginationItems(safeCurrentPage, totalPages).map((item) =>
                  typeof item === "number" ? (
                    <Link
                      key={item}
                      href={getPageUrl(item)}
                      prefetch={false}
                      onNavigate={(event) => {
                        event.preventDefault();
                        handlePageChange(item);
                      }}
                      aria-label={`Страница ${item}`}
                      aria-current={item === safeCurrentPage ? "page" : undefined}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition ${
                        item === safeCurrentPage
                          ? "bg-amber-500 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-600"
                      }`}
                    >
                      {item}
                    </Link>
                  ) : (
                    <span key={item} className="px-1 text-slate-400" aria-hidden="true">
                      …
                    </span>
                  )
                )}
              </div>
              <span className="min-w-28 text-center text-sm font-semibold text-slate-700 sm:hidden">
                Страница {safeCurrentPage} из {totalPages}
              </span>
              {safeCurrentPage === totalPages ? (
                <span aria-label="Следующая страница" aria-disabled="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 opacity-40">
                  <span aria-hidden="true">→</span>
                </span>
              ) : (
                <Link
                  href={getPageUrl(safeCurrentPage + 1)}
                  prefetch={false}
                  rel="next"
                  onNavigate={(event) => {
                    event.preventDefault();
                    handlePageChange(safeCurrentPage + 1);
                  }}
                  aria-label="Следующая страница"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-amber-300 hover:text-amber-600"
                >
                  <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
        )}
      </div>
    </div>
  );
}
