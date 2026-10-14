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

// Ориентиры для холодного старта — типы товаров из открытых подборок магазинов,
// а не выдуманные числа продаж конкретных моделей нашего каталога.
// https://www.vseinstrumenti.ru/category/akkumulyatornye-dreli-shurupoverty-15/makita-1/
// https://www.vseinstrumenti.ru/category/akkumulyatornye-gajkoverty-22/
// https://dvoroz.ru/start_page/content/elinstr.shtml
const STARTER_CATEGORIES = [
  /шуруповерт|шуруповёрт|винтоверт|винтовёрт|дрел/i,
  /болгарк|ушм|угловая шлиф/i,
  /перфоратор/i,
  /гайковерт|гайковёрт/i,
  /пил[аы]|лобзик/i,
  /аккумулятор|зарядн/i,
  /фен.*(техническ|строительн)|термопистолет/i,
] as const;

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

function starterCategory(item: CatalogListItem): string {
  // Проверяем тип товара, а не названия инструментов в комплектации набора.
  if (/набор\s*\d+\s*в\s*1/i.test(item.name)) return "starter:sets";
  const index = STARTER_CATEGORIES.findIndex((pattern) => pattern.test(item.subgroupLabel ?? item.name));
  return index >= 0 ? `starter:${index}` : `other:${item.subgroupLabel ?? item.groupLabel ?? item.type}`;
}

function starterRanks(items: CatalogListItem[]): Map<string, number> {
  const buckets = new Map<string, CatalogListItem[]>();
  for (const item of items) {
    const category = starterCategory(item);
    const bucket = buckets.get(category) ?? [];
    bucket.push(item);
    buckets.set(category, bucket);
  }
  const orderedBuckets = Array.from(buckets.entries()).sort(([a], [b]) => {
    const priority = (key: string) => key.startsWith("starter:")
      ? key === "starter:sets" ? STARTER_CATEGORIES.length : Number(key.slice(8))
      : STARTER_CATEGORIES.length + 1;
    return priority(a) - priority(b) || stableHash(a) - stableHash(b) || a.localeCompare(b);
  });
  for (const [, bucket] of orderedBuckets) {
    bucket.sort((a, b) => Number((b.quantity ?? 0) > 0) - Number((a.quantity ?? 0) > 0)
      || Number(b.galleryThumbnails.length > 0) - Number(a.galleryThumbnails.length > 0)
      || stableHash(a.id) - stableHash(b.id) || a.id.localeCompare(b.id));
  }

  const ranks = new Map<string, number>();
  // Чередуем типы товаров, чтобы первую страницу не заняли одинаковые анкеры
  // или десятки шуруповёртов. Порядок стабилен между страницами и обновлениями.
  const rounds = Math.max(0, ...orderedBuckets.map(([, bucket]) => bucket.length));
  for (let round = 0; round < rounds; round++) {
    for (const [, bucket] of orderedBuckets) {
      const item = bucket[round];
      if (item) ranks.set(item.id, ranks.size);
    }
  }
  return ranks;
}

export function getCatalogPopularityScore(item: CatalogListItem): number {
  const stats = item.popularity;
  const signal = (value?: number) => Math.log1p(Math.max(0, Number.isFinite(value) ? value! : 0));
  // Покупки сильнее корзины, корзина сильнее избранного, просмотры — слабый сигнал.
  return 80 * signal(stats?.purchases) + 20 * signal(stats?.cartAdds)
    + 12 * signal(stats?.favorites) + 2 * signal(stats?.views);
}

export function sortCatalogItems(items: CatalogListItem[], sort: CatalogSortOption): CatalogListItem[] {
  if (sort !== "popular") return [...items].sort((a, b) => compareCatalogItems(a, b, sort));
  const ranks = starterRanks(items);
  return [...items].sort((a, b) =>
    Number((b.quantity ?? 0) > 0) - Number((a.quantity ?? 0) > 0)
    || getCatalogPopularityScore(b) - getCatalogPopularityScore(a)
    || (ranks.get(a.id) ?? 0) - (ranks.get(b.id) ?? 0)
    || a.id.localeCompare(b.id)
  );
}

export function compareCatalogItems(a: CatalogListItem, b: CatalogListItem, sort: CatalogSortOption): number {
  const byName = a.name.localeCompare(b.name, "ru") || a.id.localeCompare(b.id);
  switch (sort) {
    case "popular":
      return getCatalogPopularityScore(b) - getCatalogPopularityScore(a)
        || stableHash(a.id) - stableHash(b.id)
        || a.id.localeCompare(b.id);
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
