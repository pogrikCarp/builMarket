// Чтение каталога из локального зеркала (таблицы CatalogProduct/CatalogFolder).
//
// Это единственный источник данных для всех страниц сайта: каталога, карточки
// товара, поиска, страниц брендов, наборов, блока акций и sitemap.xml. Ни одна
// из них больше не обращается к МойСклад при заходе посетителя - страница
// открывается со скоростью запроса к своей же БД, а число запросов к МойСклад
// не зависит от трафика (см. catalog-sync.ts).
//
// Фолбэк: пока зеркало пустое (самый первый деплой - синхронизатор ещё не
// прошёл), функции ниже прозрачно берут данные напрямую из МойСклад, как было
// раньше. Так витрина не остаётся пустой ни на одну минуту после релиза.
import type { CatalogProduct } from "@prisma/client";
import { prisma } from "./prisma";
import type { StoredProductImage } from "./catalog-images";
import {
  getAssortment,
  getAssortmentByFolder,
  getAssortmentByIds,
  getAssortmentIdsForSitemap,
  getProductById,
  getProductFolders,
  isMoyskladConfigured,
  type MoyskladAssortmentItem,
  type MoyskladAssortmentResponse,
  type MoyskladProductFolder,
  type MoyskladProductFolderResponse,
} from "./moysklad";
import {
  getFolderGroupLabel,
  getFolderSubgroupLabel,
  getMoyskladImageProxyUrl,
  toCatalogListItem,
  type CatalogListItem,
} from "./moysklad-format";

const MOYSKLAD_BASE_URL = "https://api.moysklad.ru/api/remap/1.2";

// Готовность зеркала проверяется на каждый запрос страницы, поэтому результат
// кэшируем: как только зеркало наполнено, ответ "готово" уже не меняется.
let mirrorReadyCache: { value: boolean; expiresAt: number } | null = null;
const MIRROR_READY_TTL_MS = 30_000;

/**
 * Зеркало считается готовым только после первого УСПЕШНО ЗАВЕРШЁННОГО полного
 * синка, а не просто при наличии товаров в таблице. Иначе во время самой первой
 * синхронизации (она идёт минутами, потому что качает все фотографии) сайт
 * показывал бы каталог частично - те позиции, которые синк успел записать.
 * До этого момента данные берутся напрямую из МойСклад, как было раньше.
 */
export async function isCatalogMirrorReady(): Promise<boolean> {
  if (mirrorReadyCache && mirrorReadyCache.expiresAt > Date.now()) return mirrorReadyCache.value;

  try {
    const [count, completedFullSync] = await Promise.all([
      prisma.catalogProduct.count({ where: { archived: false } }),
      prisma.catalogSyncRun.findFirst({ where: { mode: "full", status: "OK" }, select: { id: true } }),
    ]);
    const value = count > 0 && Boolean(completedFullSync);
    mirrorReadyCache = { value, expiresAt: Date.now() + (value ? MIRROR_READY_TTL_MS * 10 : MIRROR_READY_TTL_MS) };
    return value;
  } catch (error) {
    console.error("[catalog-db] Не удалось проверить зеркало каталога:", error);
    return false;
  }
}

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
    const fullUrl = image.url ?? getMoyskladImageProxyUrl(image.remoteHref);
    const thumbUrl = image.thumbUrl ?? getMoyskladImageProxyUrl(image.remoteThumbHref) ?? fullUrl;
    if (fullUrl) full.push(fullUrl);
    if (thumbUrl) thumbs.push(thumbUrl);
  }

  return { full, thumbs };
}

function toListItem(row: CatalogProduct): CatalogListItem {
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
  const images = parseImages(row.images);

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
        const full = image.url ?? image.remoteHref;
        const thumb = image.thumbUrl ?? image.remoteThumbHref ?? full;
        return { meta: { href: full ?? "" }, miniature: thumb ? { href: thumb } : undefined };
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
    meta: { href: folder.href, type: "productfolder" },
    id: folder.id,
    name: folder.name,
    pathName: folder.pathName ?? undefined,
    productFolder: folder.parentHref
      ? { meta: { href: folder.parentHref }, name: nameByHref.get(folder.parentHref) }
      : undefined,
  };
}

export async function getCatalogFolders(): Promise<MoyskladProductFolderResponse> {
  const folders = await prisma.catalogFolder.findMany({ orderBy: { name: "asc" } });

  if (folders.length === 0) {
    if (!isMoyskladConfigured()) return { rows: [], meta: { size: 0, limit: 0, offset: 0 } };
    return getProductFolders();
  }

  const nameByHref = new Map(folders.map((folder) => [folder.href, folder.name]));
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
    const siblings = childrenByParent.get(folder.parentHref) ?? [];
    siblings.push(folder);
    childrenByParent.set(folder.parentHref, siblings);
  }

  const root = folders.find((folder) => folder.href === folderHref);
  if (!root) return [];

  const ids: string[] = [];
  const queue = [root];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    ids.push(current.id);
    queue.push(...(childrenByParent.get(current.href) ?? []));
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

async function queryMirror(query: CatalogQuery) {
  const limit = Math.min(Math.max(query.limit ?? 100, 1), 1000);
  const offset = Math.max(query.offset ?? 0, 0);
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
  if (await isCatalogMirrorReady()) {
    const { rows, total, limit, offset } = await queryMirror(query);
    return { rows: rows.map(toListItem), total, limit, offset };
  }

  const live = await getCatalogAssortment(query);
  return {
    rows: live.rows.map(toCatalogListItem),
    total: live.meta.size,
    limit: live.meta.limit,
    offset: live.meta.offset,
  };
}

/**
 * Полные карточки в формате МойСклад - для потребителей, которым нужны описание
 * и галерея целиком (поиск в оверлее, подбор товара в админке).
 */
export async function getCatalogAssortment(query: CatalogQuery): Promise<MoyskladAssortmentResponse> {
  if (await isCatalogMirrorReady()) {
    const { rows, total, limit, offset } = await queryMirror(query);
    return { rows: rows.map(toAssortmentItem), meta: { size: total, limit, offset } };
  }

  if (!isMoyskladConfigured()) {
    return { rows: [], meta: { size: 0, limit: 0, offset: 0 } };
  }
  if (query.folderHref) {
    return getAssortmentByFolder(query.folderHref, query.limit ?? 100, query.offset ?? 0);
  }
  return getAssortment(query.limit ?? 100, query.offset ?? 0, query.search);
}

export async function getCatalogProduct(id: string, knownType?: string): Promise<MoyskladAssortmentItem | null> {
  const row = await prisma.catalogProduct.findUnique({ where: { id } });
  if (row) return toAssortmentItem(row);

  if (!isMoyskladConfigured()) return null;
  try {
    const item = await getProductById(id, knownType);
    return item?.name ? item : null;
  } catch {
    return null;
  }
}

/**
 * Карточки товаров по списку id - блок акций, готовые наборы, избранное.
 * Товары, которых нет в зеркале, просто отсутствуют в Map.
 */
export async function getCatalogItemsByIds(ids: string[]): Promise<Map<string, MoyskladAssortmentItem>> {
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) return new Map();

  const rows = await prisma.catalogProduct.findMany({ where: { id: { in: uniqueIds } } });
  if (rows.length > 0 || !isMoyskladConfigured()) {
    return new Map(rows.map((row) => [row.id, toAssortmentItem(row)]));
  }

  try {
    return await getAssortmentByIds(uniqueIds);
  } catch {
    return new Map();
  }
}

export async function getCatalogProductIds(maxItems = 5000): Promise<string[]> {
  // Карта сайта не должна собираться по наполовину наполненному зеркалу -
  // иначе в sitemap.xml попадёт лишь часть товаров.
  if (await isCatalogMirrorReady()) {
    const rows = await prisma.catalogProduct.findMany({
      where: { archived: false },
      select: { id: true },
      take: maxItems,
      orderBy: { name: "asc" },
    });
    return rows.map((row) => row.id);
  }

  if (!isMoyskladConfigured()) return [];
  return getAssortmentIdsForSitemap(maxItems);
}
