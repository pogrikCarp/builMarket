// One tab, one last product visit. No catalog data is copied into browser storage.
export const CATALOG_RETURN_KEY = "domstroy:catalog-return:v1";
export type CatalogReturn = {
  url: string;
  productId: string;
  scrollY: number;
  offset: number;
  savedAt: number;
  pending: boolean;
};

export function readCatalogReturn(): CatalogReturn | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(CATALOG_RETURN_KEY) ?? "null");
    if (!value || typeof value.url !== "string" || !/^\/catalog(?:\?|$)/.test(value.url) ||
      typeof value.productId !== "string" || !Number.isFinite(value.scrollY) ||
      !Number.isFinite(value.offset) || !Number.isFinite(value.savedAt) || typeof value.pending !== "boolean" || Date.now() - value.savedAt > 3_600_000) return null;
    return value;
  } catch { return null; }
}

export function writeCatalogReturn(value: CatalogReturn) {
  try { sessionStorage.setItem(CATALOG_RETURN_KEY, JSON.stringify(value)); } catch { /* Private mode / full storage. */ }
}

export function parseAttributeFilters(value?: string): Record<string, Set<string>> {
  try {
    const entries: unknown = JSON.parse(value ?? "{}");
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) return {};
    return Object.fromEntries(Object.entries(entries).filter(([key, values]) => key.length <= 200 &&
      Array.isArray(values) && values.every(value => typeof value === "string"))
      .map(([key, values]) => [key, new Set(values as string[])]));
  } catch { return {}; }
}

export function serializeAttributeFilters(filters: Record<string, Set<string>>) {
  const entries = Object.entries(filters).filter(([, values]) => values.size)
    .sort(([a], [b]) => a === b ? 0 : a < b ? -1 : 1).map(([name, values]) => [name, [...values].sort()]);
  return entries.length ? JSON.stringify(Object.fromEntries(entries)) : undefined;
}
