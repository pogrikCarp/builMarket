import type { CatalogListItem } from "./moysklad-format";

export type CatalogSortOption = "popular" | "name-asc" | "name-desc" | "price-asc" | "price-desc";
export const DEFAULT_CATALOG_SORT: CatalogSortOption = "popular";
export const CATALOG_SORT_LABELS: Record<CatalogSortOption, string> = {
  popular: "По популярности",
  "name-asc": "По алфавиту (А-Я)",
  "name-desc": "По алфавиту (Я-А)",
  "price-asc": "По цене (сначала дешевле)",
  "price-desc": "По цене (сначала дороже)",
};

export function isCatalogSortOption(value?: string): value is CatalogSortOption {
  return value != null && Object.hasOwn(CATALOG_SORT_LABELS, value);
}

export function compareCatalogItems(a: CatalogListItem, b: CatalogListItem, sort: CatalogSortOption): number {
  const byName = a.name.localeCompare(b.name, "ru") || a.id.localeCompare(b.id);
  switch (sort) {
    case "popular":
      return (b.popularity?.purchases ?? 0) - (a.popularity?.purchases ?? 0)
        || (b.popularity?.favorites ?? 0) - (a.popularity?.favorites ?? 0)
        || byName;
    case "name-desc":
      return -byName;
    case "price-asc":
      return (a.salePrices?.[0]?.value ?? Infinity) - (b.salePrices?.[0]?.value ?? Infinity) || byName;
    case "price-desc":
      return (b.salePrices?.[0]?.value ?? -Infinity) - (a.salePrices?.[0]?.value ?? -Infinity) || byName;
    default:
      return byName;
  }
}
