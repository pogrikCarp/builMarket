// Чтение каталога из локального зеркала (таблицы CatalogProduct/CatalogFolder).
//
// Это единственный источник данных для всех страниц сайта: каталога, карточки
// товара, поиска, страниц брендов, наборов, блока акций и sitemap.xml. Ни одна
// из них больше не обращается к МойСклад при заходе посетителя - страница
// открывается со скоростью запроса к своей же БД, а число запросов к МойСклад
// не зависит от трафика (см. catalog-sync.ts).
//
// Если зеркало ещё не наполнено, витрина возвращает пустой результат. Это
// намеренно: трафик посетителей никогда не должен становиться источником
// запросов к МойСклад. Первичное заполнение и все последующие обновления делает
// только фоновый синхронизатор (catalog-sync.ts).
import type { CatalogProduct } from "@prisma/client";
import { prisma } from "./prisma";
import type { StoredProductImage } from "./catalog-images";
import {
  type MoyskladAssortmentItem,
  type MoyskladAssortmentResponse,
  type MoyskladProductFolder,
  type MoyskladProductFolderResponse,
} from "./moysklad";
import {
  normalizeMoyskladHref,
  type CatalogListItem,
} from "./moysklad-format";

const MOYSKLAD_BASE_URL = "https://api.moysklad.ru/api/remap/1.2";

function parseImages(value: unknown): StoredProductImage[] {
  return Array.isArray(value) ? (value as StoredProductImage[]) : [];
}

function parseAttributes(value: unknown): { name: string; value: string }[] {
  return Array.isArray(value) ? (value as { name: string; value: string }[]) : [];
}

function imageUrls(images: StoredProductImage[]) {
  const full: string[] = [];
  const thumbs: string[] = [];

  for (const image of images) {
    // В готовом зеркале браузер никогда не должен тянуть картинку через API
    // МойСклад. Если локальная загрузка конкретного файла не удалась, временно
    // показываем белый фон; синхронизатор повторит скачивание, не перекладывая
    // API-нагрузку на посетителей.
    const fullUrl = image.url ?? null;
    const thumbUrl = image.thumbUrl ?? fullUrl;
    if (fullUrl) full.push(fullUrl);
    if (thumbUrl) thumbs.push(thumbUrl);
  }

  return { full, thumbs };
}

type CatalogListRow = Pick<
  CatalogProduct,
  | "id"
  | "entityType"
  | "name"
  | "article"
  | "code"
  | "price"
  | "quantity"
  | "groupLabel"
  | "subgroupLabel"
  | "images"
  | "attributes"
>;

function toListItem(row: CatalogListRow): CatalogListItem {
  const { thumbs } = imageUrls(parseImages(row.images));
  return {
    id: row.id,
    type: row.entityType,
    name: row.name,
    article: row.article ?? undefined,
    code: row.code ?? undefined,
    quantity: row.quantity ?? undefined,
    salePrices: row.price != null ? [{ value: row.price }] : undefined,
    groupLabel: row.groupLabel ?? undefined,
    subgroupLabel: row.subgroupLabel ?? undefined,
    galleryThumbnails: thumbs,
    attributes: parseAttributes(row.attributes),
  };
}

/**
 * Приводит строку зеркала к той же форме, что отдаёт МойСклад, - чтобы карточка
 * товара, страницы брендов, наборов и акций работали с зеркалом без изменений в
 * своей логике. В ссылки на фото подставлены локальные пути, поэтому хелперы
 * getItemGalleryUrls/getItemGalleryThumbnailUrls отдают их как есть (см.
 * getMoyskladImageProxyUrl).
 */
function toAssortmentItem(row: CatalogProduct): MoyskladAssortmentItem {
  const images = parseImages(row.images).filter((image) => Boolean(image.url));

  return {
    meta: { href: `${MOYSKLAD_BASE_URL}/entity/${row.entityType}/${row.id}`, type: row.entityType },
    id: row.id,
    name: row.name,
    code: row.code ?? undefined,
    article: row.article ?? undefined,
    description: row.description ?? undefined,
    salePrices: row.price != null ? [{ value: row.price, currency: { name: "руб" } }] : undefined,
    quantity: row.quantity ?? undefined,
    uom: row.uom ? { name: row.uom } : undefined,
    productFolder: row.folderId
      ? {
          meta: { href: "", type: "productfolder" },
          id: row.folderId,
          name: row.folderName ?? undefined,
          pathName: row.folderPath ?? undefined,
        }
      : undefined,
    images: {
      meta: { href: "", size: images.length },
      rows: images.map((image) => {
        const full = image.url ?? "";
        const thumb = image.thumbUrl ?? full;
        return { meta: { href: full }, miniature: thumb ? { href: thumb } : undefined };
      }),
    },
    attributes: parseAttributes(row.attributes).map((attribute) => ({
      id: "",
      name: attribute.name,
      type: "string",
      value: attribute.value,
    })),
  };
}

function toFolderRow(
  folder: { id: string; name: string; pathName: string | null; href: string; parentHref: string | null },
  nameByHref: Map<string, string>
): MoyskladProductFolder {
  return {
    meta: { href: normalizeMoyskladHref(folder.href), type: "productfolder" },
    id: folder.id,
    name: folder.name,
    pathName: folder.pathName ?? undefined,
    productFolder: folder.parentHref
      ? {
          meta: { href: normalizeMoyskladHref(folder.parentHref) },
          name: nameByHref.get(normalizeMoyskladHref(folder.parentHref)),
        }
      : undefined,
  };
}

export async function getCatalogFolders(): Promise<MoyskladProductFolderResponse> {
  const folders = await prisma.catalogFolder.findMany({ orderBy: { name: "asc" } });
  const nameByHref = new Map(folders.map((folder) => [normalizeMoyskladHref(folder.href), folder.name]));
  const rows = folders.map((folder) => toFolderRow(folder, nameByHref));
  return { rows, meta: { size: rows.length, limit: rows.length, offset: 0 } };
}

/**
 * Все id категории и её подкатегорий: в МойСклад выбор раздела показывает и
 * товары вложенных категорий (filter=productFolder=...;withSubFolders=true),
 * то же поведение воспроизводим по локальному дереву.
 */
async function getFolderIdsWithDescendants(folderHref: string): Promise<string[]> {
  const folders = await prisma.catalogFolder.findMany({
    select: { id: true, href: true, parentHref: true },
  });

  type FolderNode = (typeof folders)[number];
  const childrenByParent = new Map<string, FolderNode[]>();
  for (const folder of folders) {
    if (!folder.parentHref) continue;
    const parentHref = normalizeMoyskladHref(folder.parentHref);
    const siblings = childrenByParent.get(parentHref) ?? [];
    siblings.push(folder);
    childrenByParent.set(parentHref, siblings);
  }

  const normalizedFolderHref = normalizeMoyskladHref(folderHref);
  const root = folders.find((folder) => normalizeMoyskladHref(folder.href) === normalizedFolderHref);
  if (!root) return [];

  const ids: string[] = [];
  const queue = [root];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    ids.push(current.id);
    queue.push(...(childrenByParent.get(normalizeMoyskladHref(current.href)) ?? []));
  }

  return ids;
}

type CatalogQuery = {
  search?: string;
  folderHref?: string;
  limit?: number;
  offset?: number;
};

async function buildWhere(query: CatalogQuery) {
  const where: {
    archived: boolean;
    folderId?: { in: string[] };
    AND?: { searchText: { contains: string } }[];
  } = { archived: false };

  if (query.folderHref) {
    where.folderId = { in: await getFolderIdsWithDescendants(query.folderHref) };
  }

  // Поиск по словам: каждое слово запроса должно найтись в searchText (название,
  // артикул, код, категория, значения характеристик). В отличие от filter=name~
  // в МойСклад это находит товар и по артикулу, и по бренду из характеристик,
  // и не зависит от порядка слов.
  const words = (query.search ?? "")
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0)
    .slice(0, 8);
  if (words.length > 0) {
    where.AND = words.map((word) => ({ searchText: { contains: word } }));
  }

  return where;
}

// Поля, из которых собирается карточка списка (CatalogListItem). Важно не
// выбирать description и searchText: это самые длинные колонки таблицы, а
// списку каталога они не нужны - на выборке в сотни позиций лишние мегабайты
// из БД заметно удлиняли рендер страницы /catalog.
const LIST_SELECT = {
  id: true,
  entityType: true,
  name: true,
  article: true,
  code: true,
  price: true,
  quantity: true,
  groupLabel: true,
  subgroupLabel: true,
  images: true,
  attributes: true,
} as const;

function normalizePaging(query: CatalogQuery) {
  return {
    limit: Math.min(Math.max(query.limit ?? 100, 1), 1000),
    offset: Math.max(query.offset ?? 0, 0),
  };
}

async function queryMirrorList(query: CatalogQuery) {
  const { limit, offset } = normalizePaging(query);
  const where = await buildWhere(query);

  const [rows, total] = await Promise.all([
    prisma.catalogProduct.findMany({
      where,
      select: LIST_SELECT,
      orderBy: { name: "asc" },
      take: limit,
      skip: offset,
    }),
    prisma.catalogProduct.count({ where }),
  ]);

  return { rows, total, limit, offset };
}

async function queryMirrorFull(query: CatalogQuery) {
  const { limit, offset } = normalizePaging(query);
  const where = await buildWhere(query);

  const [rows, total] = await Promise.all([
    prisma.catalogProduct.findMany({ where, orderBy: { name: "asc" }, take: limit, skip: offset }),
    prisma.catalogProduct.count({ where }),
  ]);

  return { rows, total, limit, offset };
}

/**
 * Облегчённые карточки для списков каталога (страница /catalog и её API).
 */
export async function getCatalogList(
  query: CatalogQuery
): Promise<{ rows: CatalogListItem[]; total: number; limit: number; offset: number }> {
  const { rows, total, limit, offset } = await queryMirrorList(query);
  return { rows: rows.map(toListItem), total, limit, offset };
}

/**
 * Полные карточки в формате МойСклад - для потребителей, которым нужны описание
 * и галерея целиком (поиск в оверлее, подбор товара в админке).
 */
export async function getCatalogAssortment(query: CatalogQuery): Promise<MoyskladAssortmentResponse> {
  const { rows, total, limit, offset } = await queryMirrorFull(query);
  return { rows: rows.map(toAssortmentItem), meta: { size: total, limit, offset } };
}

export async function getCatalogProduct(id: string): Promise<MoyskladAssortmentItem | null> {
  const row = await prisma.catalogProduct.findUnique({ where: { id } });
  return row && !row.archived ? toAssortmentItem(row) : null;
}

/**
 * Карточки товаров по списку id - блок акций, готовые наборы, избранное.
 * Товары, которых нет в зеркале, просто отсутствуют в Map.
 */
export async function getCatalogItemsByIds(ids: string[]): Promise<Map<string, MoyskladAssortmentItem>> {
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) return new Map();

  const rows = await prisma.catalogProduct.findMany({ where: { id: { in: uniqueIds }, archived: false } });
  return new Map(rows.map((row) => [row.id, toAssortmentItem(row)]));
}

export async function getCatalogProductIds(maxItems = 5000): Promise<string[]> {
  const rows = await prisma.catalogProduct.findMany({
    where: { archived: false },
    select: { id: true },
    take: maxItems,
    orderBy: { name: "asc" },
  });
  return rows.map((row) => row.id);
}
