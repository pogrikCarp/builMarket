// Фоновая синхронизация каталога МойСклад -> локальная БД.
//
// Это единственное место в приложении, которое обращается к МойСклад за
// каталогом. Посетители сайта читают только локальные таблицы (catalog-db.ts) и
// локальные файлы фотографий (catalog-images.ts), поэтому количество запросов к
// МойСклад больше НЕ зависит от количества посетителей и страниц: сколько бы
// людей ни открыло каталог, к API уйдёт ровно столько запросов, сколько сделает
// синхронизатор по расписанию.
//
// Режимы:
//  - full     - товары, категории, атрибуты и фотографии. Тяжёлый, раз в сутки
//               по systemd-таймеру (см. scripts/deploy.sh) и по кнопке в админке.
//  - stock    - только остатки и цены, без expand и без фото: 1 запрос на 1000
//               товаров. Дёшево, поэтому раз в 10 минут - остатки на сайте
//               остаются практически живыми.
//  - products - точечно по списку id: после оформления заказа (списали остаток)
//               и по вебхуку МойСклад об изменении товара.
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { cleanupOrphanImages, storeProductImages, type StoredProductImage } from "./catalog-images";
import {
  buildUrl,
  getAuthHeaders,
  isMoyskladConfigured,
  type MoyskladAssortmentItem,
  type MoyskladImage,
  type MoyskladProductFolder,
} from "./moysklad";
import { moyskladFetch } from "./moysklad-limiter";
import {
  formatAttributeValue,
  getFolderGroupLabel,
  getFolderSubgroupLabel,
  normalizeMoyskladHref,
} from "./moysklad-format";

export type CatalogSyncMode = "full" | "stock" | "products";
export type CatalogSyncTrigger = "cron" | "admin" | "order" | "webhook" | "bootstrap";

export type CatalogSyncResult = {
  mode: CatalogSyncMode;
  status: "OK" | "FAILED" | "SKIPPED";
  itemCount: number;
  imageCount: number;
  removedImageCount?: number;
  durationMs: number;
  error?: string;
};

// МойСклад ограничивает limit до 100, когда в запросе есть expand.
const EXPAND_PAGE_SIZE = 100;
// Без expand строки заметно легче, поэтому остатки тянем крупными страницами.
const PLAIN_PAGE_SIZE = 1000;
const ASSORTMENT_EXPAND = "productFolder,productFolder.productFolder,images,attributes";
// Больше 100 условий id=...;id=... в один фильтр МойСклад не принимает.
const IDS_PER_REQUEST = 100;
// Сколько товаров обрабатываем одновременно. Это НЕ ослабление лимитов: сколько
// запросов реально уйдёт в МойСклад в секунду, по-прежнему решает лимитер
// (moysklad-limiter.ts) - здесь мы лишь даём ему очередь, из которой он может
// выбирать разрешённое окно целиком, вместо загрузки строго по одному файлу.
const PRODUCT_CONCURRENCY = 6;
// Если предыдущий синк упал так, что не успел закрыть свою запись в
// CatalogSyncRun (например, процесс перезапустили посреди полного синка),
// запись со статусом RUNNING висела бы вечно и блокировала все следующие синки.
const STALE_RUN_MS = 60 * 60 * 1000;

// Защита от параллельного запуска внутри одного процесса: полный синк идёт
// минутами, и второй одновременный запуск (кнопка в админке во время работы
// таймера) удвоил бы нагрузку на API МойСклад без всякой пользы.
let syncInProgress = false;

function parseMoyskladDate(value?: string): Date | null {
  if (!value) return null;
  // МойСклад отдаёт "2026-09-14 16:28:42.123" - пробел вместо T и без таймзоны.
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildSearchText(item: MoyskladAssortmentItem, attributes: { name: string; value: string }[]) {
  return [
    item.name,
    item.article,
    item.code,
    item.productFolder?.name,
    item.productFolder?.pathName,
    ...attributes.map((attribute) => attribute.value),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await moyskladFetch(url, { headers: getAuthHeaders(), cache: "no-store" });
  if (!response.ok) {
    throw new Error(`MoySklad API error: ${response.status} ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

async function fetchAllFolders(): Promise<MoyskladProductFolder[]> {
  const rows: MoyskladProductFolder[] = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const params = new URLSearchParams();
    params.append("limit", String(EXPAND_PAGE_SIZE));
    params.append("offset", String(offset));
    params.append("order", "name,asc");
    params.append("expand", "productFolder");
    const page = await fetchJson<{ rows: MoyskladProductFolder[]; meta: { size: number } }>(
      buildUrl("/entity/productfolder", params)
    );
    rows.push(...page.rows);
    total = page.meta.size;
    offset += EXPAND_PAGE_SIZE;
  }

  return rows;
}

type ExistingProduct = { id: string; msUpdatedAt: Date | null; images: Prisma.JsonValue; archived?: boolean };

function needsImageRefresh(item: MoyskladAssortmentItem, existing: ExistingProduct | undefined): boolean {
  const remoteCount = item.images?.meta?.size ?? 0;
  if (remoteCount === 0) return false;
  if (!existing) return true;

  const stored = Array.isArray(existing.images) ? (existing.images as unknown as StoredProductImage[]) : [];
  if (stored.length !== remoteCount) return true;
  // Файла нет на диске (прошлый синк не смог скачать) - пробуем ещё раз.
  if (stored.some((image) => !image.url)) return true;

  const remoteUpdatedAt = parseMoyskladDate(item.updated);
  if (!remoteUpdatedAt || !existing.msUpdatedAt) return true;
  return remoteUpdatedAt.getTime() !== existing.msUpdatedAt.getTime();
}

async function upsertProducts(
  items: MoyskladAssortmentItem[],
  existingById: Map<string, ExistingProduct>
): Promise<number> {
  let downloadedImages = 0;

  // Товары обрабатываем пачками параллельно: у каждого свои запросы за списком
  // фотографий и за файлами, а темп обращений к МойСклад всё равно держит общий
  // лимитер (moysklad-limiter.ts). Строго последовательная обработка не
  // выбирала разрешённое окно и растягивала первый синк в разы.
  for (let index = 0; index < items.length; index += PRODUCT_CONCURRENCY) {
    const chunk = items.slice(index, index + PRODUCT_CONCURRENCY);
    const downloaded = await Promise.all(chunk.map((item) => upsertProduct(item, existingById.get(item.id))));
    downloadedImages += downloaded.reduce((sum, count) => sum + count, 0);
  }

  return downloadedImages;
}

/** Возвращает количество реально скачанных файлов фотографий. */
async function upsertProduct(item: MoyskladAssortmentItem, existing: ExistingProduct | undefined): Promise<number> {
  let downloadedImages = 0;

  const attributes: { name: string; value: string }[] = [];
  for (const attribute of item.attributes ?? []) {
    const value = formatAttributeValue(attribute.value);
    if (value) attributes.push({ name: attribute.name, value });
  }

  let images: StoredProductImage[] = Array.isArray(existing?.images)
    ? (existing.images as unknown as StoredProductImage[])
    : [];

  if (needsImageRefresh(item, existing)) {
    try {
      const imageRows = await fetchJson<{ rows?: MoyskladImage[] }>(item.images!.meta.href);
      const stored = await storeProductImages(imageRows.rows ?? []);
      images = stored.images;
      downloadedImages += stored.downloadedCount;
    } catch (error) {
      // Не роняем весь синк из-за одного товара: оставляем прежние фото
      // (или пустую галерею) и попробуем на следующем запуске.
      console.error(`[catalog-sync] Не удалось обновить фото товара ${item.id}:`, error);
    }
  } else if ((item.images?.meta?.size ?? 0) === 0) {
    images = [];
  }

  const data = {
    entityType: item.meta.type,
    name: item.name,
    description: item.description ?? null,
    article: item.article ?? null,
    code: item.code ?? null,
    price: item.salePrices?.[0]?.value ?? null,
    quantity: item.quantity ?? null,
    uom: item.uom?.name ?? null,
    folderId: item.productFolder?.id ?? null,
    folderName: item.productFolder?.name ?? null,
    folderPath: item.productFolder?.pathName ?? null,
    groupLabel: getFolderGroupLabel(item.productFolder) ?? null,
    subgroupLabel: getFolderSubgroupLabel(item.productFolder) ?? null,
    images: images as unknown as Prisma.InputJsonValue,
    attributes: attributes as unknown as Prisma.InputJsonValue,
    msUpdatedAt: parseMoyskladDate(item.updated),
    archived: false,
    searchText: buildSearchText(item, attributes),
    syncedAt: new Date(),
  };

  await prisma.catalogProduct.upsert({
    where: { id: item.id },
    create: { id: item.id, ...data },
    update: data,
  });

  return downloadedImages;
}

async function loadExistingProducts(ids: string[]): Promise<Map<string, ExistingProduct>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.catalogProduct.findMany({
    where: { id: { in: ids } },
    select: { id: true, msUpdatedAt: true, images: true },
  });
  return new Map(rows.map((row) => [row.id, row]));
}

async function syncFolders(): Promise<number> {
  const folders = await fetchAllFolders();
  if (folders.length === 0) return 0;

  for (const folder of folders) {
    const data = {
      name: folder.name,
      pathName: folder.pathName ?? null,
      href: normalizeMoyskladHref(folder.meta.href),
      parentHref: normalizeMoyskladHref(folder.productFolder?.meta?.href) || null,
      syncedAt: new Date(),
    };
    await prisma.catalogFolder.upsert({
      where: { id: folder.id },
      create: { id: folder.id, ...data },
      update: data,
    });
  }

  // Категории, удалённые в МойСклад, убираем сразу - в отличие от товаров, на
  // них не ссылаются ни заказы, ни внешние ссылки поисковиков.
  await prisma.catalogFolder.deleteMany({
    where: { id: { notIn: folders.map((folder) => folder.id) } },
  });

  return folders.length;
}

async function syncFullCatalog(runStartedAt: Date): Promise<{ itemCount: number; imageCount: number; removedImageCount: number }> {
  await syncFolders();

  let offset = 0;
  let total = Infinity;
  let itemCount = 0;
  let imageCount = 0;

  while (offset < total) {
    const params = new URLSearchParams();
    params.append("limit", String(EXPAND_PAGE_SIZE));
    params.append("offset", String(offset));
    params.append("expand", ASSORTMENT_EXPAND);
    const page = await fetchJson<{ rows: MoyskladAssortmentItem[]; meta: { size: number } }>(
      buildUrl("/entity/assortment", params)
    );

    const existingById = await loadExistingProducts(page.rows.map((row) => row.id));
    imageCount += await upsertProducts(page.rows, existingById);
    itemCount += page.rows.length;

    total = page.meta.size;
    offset += EXPAND_PAGE_SIZE;
  }

  // Товары, которых в этом проходе МойСклад не отдал (удалены, сняты с продажи),
  // помечаем архивными: с витрины они исчезнут, но записи останутся, чтобы
  // старые ссылки и заказы не превращались в ошибку.
  if (itemCount > 0) {
    await prisma.catalogProduct.updateMany({
      where: { syncedAt: { lt: runStartedAt }, archived: false },
      data: { archived: true },
    });
  }

  let removedImageCount = 0;
  if (itemCount > 0) {
    const referenced = new Set<string>();
    const rows = await prisma.catalogProduct.findMany({ select: { images: true } });
    for (const row of rows) {
      const images = Array.isArray(row.images) ? (row.images as unknown as StoredProductImage[]) : [];
      for (const image of images) {
        if (image.url) referenced.add(image.url);
        if (image.thumbUrl) referenced.add(image.thumbUrl);
      }
    }
    removedImageCount = await cleanupOrphanImages(referenced);
  }

  return { itemCount, imageCount, removedImageCount };
}

/**
 * Инкрементальное обновление каталога.
 *
 * Основная выборка идёт без expand: до 1000 позиций за один запрос. Помимо цен
 * и остатков она содержит id и `updated`, поэтому мы можем обнаружить новые,
 * разархивированные и изменённые товары. Только для них делается дополнительный
 * батч-запрос с описанием, категорией, атрибутами и метаданными фотографий.
 *
 * Раньше частая задача обновляла UPDATE-ом только уже существующие строки. Новый
 * товар/раздел появлялся на сайте лишь после ночного полного синка; если таймер
 * полного синка не срабатывал, он не появлялся вообще.
 */
async function syncStock(
  runStartedAt: Date
): Promise<{ itemCount: number; imageCount: number; changedItemCount: number; folderCount: number }> {
  const folderCount = await syncFolders();
  const existingRows = await prisma.catalogProduct.findMany({
    select: { id: true, msUpdatedAt: true, images: true, archived: true },
  });
  const existingById = new Map(existingRows.map((row) => [row.id, row]));

  let offset = 0;
  let total = Infinity;
  const updates: { id: string; quantity: number | null; price: number | null }[] = [];
  const changedIds: string[] = [];

  while (offset < total) {
    const params = new URLSearchParams();
    params.append("limit", String(PLAIN_PAGE_SIZE));
    params.append("offset", String(offset));
    const page = await fetchJson<{ rows: MoyskladAssortmentItem[]; meta: { size: number } }>(
      buildUrl("/entity/assortment", params)
    );
    for (const row of page.rows) {
      const existing = existingById.get(row.id);
      const remoteUpdatedAt = parseMoyskladDate(row.updated);
      const metadataChanged = Boolean(
        !existing ||
          existing.archived ||
          (remoteUpdatedAt &&
            (!existing.msUpdatedAt || remoteUpdatedAt.getTime() !== existing.msUpdatedAt.getTime()))
      );
      if (metadataChanged) changedIds.push(row.id);
      updates.push({
        id: row.id,
        quantity: row.quantity ?? null,
        price: row.salePrices?.[0]?.value ?? null,
      });
    }
    total = page.meta.size;
    offset += PLAIN_PAGE_SIZE;
  }

  // Одним UPDATE ... FROM (VALUES ...) на пачку вместо отдельного запроса к БД
  // на каждый товар - иначе синк остатков раз в 10 минут дёргал бы БД тысячи раз.
  const CHUNK = 500;
  for (let index = 0; index < updates.length; index += CHUNK) {
    const chunk = updates.slice(index, index + CHUNK);
    const values = chunk.map(
      (row) => Prisma.sql`(${row.id}::text, ${row.quantity}::double precision, ${row.price}::integer)`
    );
    await prisma.$executeRaw`
      UPDATE "CatalogProduct" AS p
      SET "quantity" = v.quantity, "price" = v.price, "syncedAt" = NOW()
      FROM (VALUES ${Prisma.join(values)}) AS v(id, quantity, price)
      WHERE p.id = v.id
    `;
  }

  let imageCount = 0;
  if (changedIds.length > 0) {
    const changed = await syncProducts(changedIds);
    imageCount = changed.imageCount;
  }

  // Полная лёгкая выборка успешно завершилась: позиции, которых МойСклад больше
  // не отдаёт, скрываем. Все присутствующие строки получили свежий syncedAt
  // либо через массовый UPDATE, либо через upsert нового товара выше.
  if (updates.length > 0) {
    await prisma.catalogProduct.updateMany({
      where: { syncedAt: { lt: runStartedAt }, archived: false },
      data: { archived: true },
    });
  }

  return {
    itemCount: updates.length,
    imageCount,
    changedItemCount: changedIds.length,
    folderCount,
  };
}

/**
 * Точечное обновление конкретных товаров (после заказа, по вебхуку).
 * Один запрос на каждые 100 id.
 */
async function syncProducts(productIds: string[]): Promise<{ itemCount: number; imageCount: number }> {
  let itemCount = 0;
  let imageCount = 0;

  for (let index = 0; index < productIds.length; index += IDS_PER_REQUEST) {
    const chunk = productIds.slice(index, index + IDS_PER_REQUEST);
    const params = new URLSearchParams();
    params.append("limit", String(chunk.length));
    params.append("expand", ASSORTMENT_EXPAND);
    params.append("filter", chunk.map((id) => `id=${id}`).join(";"));
    const page = await fetchJson<{ rows: MoyskladAssortmentItem[] }>(buildUrl("/entity/assortment", params));

    const existingById = await loadExistingProducts(page.rows.map((row) => row.id));
    imageCount += await upsertProducts(page.rows, existingById);
    itemCount += page.rows.length;
  }

  return { itemCount, imageCount };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function runCatalogSync(options: {
  mode: CatalogSyncMode;
  trigger: CatalogSyncTrigger;
  productIds?: string[];
}): Promise<CatalogSyncResult> {
  const { mode, trigger } = options;
  const productIds = Array.from(new Set((options.productIds ?? []).filter((id) => UUID_RE.test(id))));
  const startedAt = Date.now();

  if (!isMoyskladConfigured()) {
    return { mode, status: "SKIPPED", itemCount: 0, imageCount: 0, durationMs: 0, error: "MOYSKLAD_TOKEN не настроен" };
  }
  if (mode === "products" && productIds.length === 0) {
    return { mode, status: "SKIPPED", itemCount: 0, imageCount: 0, durationMs: 0, error: "Не переданы id товаров" };
  }
  if (syncInProgress) {
    return { mode, status: "SKIPPED", itemCount: 0, imageCount: 0, durationMs: 0, error: "Синхронизация уже выполняется" };
  }

  const runStartedAt = new Date();
  let run: { id: string } | null = null;
  syncInProgress = true;

  try {
    // Процесс могли перезапустить посреди прошлого синка. Такие строки больше не
    // должны вечно выглядеть как RUNNING в админке и затруднять диагностику.
    await prisma.catalogSyncRun.updateMany({
      where: { status: "RUNNING", startedAt: { lt: new Date(Date.now() - STALE_RUN_MS) } },
      data: {
        status: "FAILED",
        error: "Синхронизация была прервана перезапуском процесса или превысила допустимое время",
        finishedAt: new Date(),
      },
    });
    run = await prisma.catalogSyncRun.create({ data: { mode, trigger, startedAt: runStartedAt } });

    let itemCount = 0;
    let imageCount = 0;
    let removedImageCount = 0;

    if (mode === "full") {
      const result = await syncFullCatalog(runStartedAt);
      itemCount = result.itemCount;
      imageCount = result.imageCount;
      removedImageCount = result.removedImageCount;
    } else if (mode === "stock") {
      const result = await syncStock(runStartedAt);
      itemCount = result.itemCount;
      imageCount = result.imageCount;
      console.log(
        `[catalog-sync] incremental: категорий ${result.folderCount}, новых/изменённых товаров ${result.changedItemCount}`
      );
    } else {
      const result = await syncProducts(productIds);
      itemCount = result.itemCount;
      imageCount = result.imageCount;
    }

    const durationMs = Date.now() - startedAt;
    await prisma.catalogSyncRun.update({
      where: { id: run.id },
      data: { status: "OK", itemCount, imageCount, finishedAt: new Date() },
    });
    console.log(
      `[catalog-sync] ${mode} (${trigger}): товаров ${itemCount}, новых фото ${imageCount}` +
        (removedImageCount ? `, удалено файлов ${removedImageCount}` : "") +
        `, ${Math.round(durationMs / 1000)}с`
    );
    return { mode, status: "OK", itemCount, imageCount, removedImageCount, durationMs };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    if (run) {
      await prisma.catalogSyncRun.update({
        where: { id: run.id },
        data: { status: "FAILED", error: message.slice(0, 1000), finishedAt: new Date() },
      });
    }
    console.error(`[catalog-sync] ${mode} (${trigger}) завершился ошибкой:`, message);
    return { mode, status: "FAILED", itemCount: 0, imageCount: 0, durationMs: Date.now() - startedAt, error: message };
  } finally {
    syncInProgress = false;
  }
}

/**
 * Обновляет остатки купленных товаров сразу после оформления заказа, чтобы на
 * сайте не осталось "в наличии" у того, что только что разобрали. Ошибки
 * намеренно проглатываются: заказ уже создан, и синк остатков не должен на это
 * влиять - следующий плановый синк всё равно всё выровняет.
 */
export async function refreshCatalogProductsAfterOrder(productIds: string[]): Promise<void> {
  try {
    await runCatalogSync({ mode: "products", trigger: "order", productIds });
  } catch (error) {
    console.error("[catalog-sync] Не удалось обновить остатки после заказа:", error);
  }
}

export async function getCatalogSyncStatus() {
  const [productCount, archivedCount, folderCount, lastRuns, staleRun, lastSuccessfulRefresh] = await Promise.all([
    prisma.catalogProduct.count({ where: { archived: false } }),
    prisma.catalogProduct.count({ where: { archived: true } }),
    prisma.catalogFolder.count(),
    prisma.catalogSyncRun.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.catalogSyncRun.findFirst({
      where: { status: "RUNNING", startedAt: { gte: new Date(Date.now() - STALE_RUN_MS) } },
      orderBy: { startedAt: "desc" },
    }),
    prisma.catalogSyncRun.findFirst({
      where: { status: "OK", mode: { in: ["full", "stock"] } },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true },
    }),
  ]);

  const lastSuccessfulSyncAt = lastSuccessfulRefresh?.finishedAt ?? null;
  const isStale = !lastSuccessfulSyncAt || Date.now() - lastSuccessfulSyncAt.getTime() > 30 * 60 * 1000;
  return {
    productCount,
    archivedCount,
    folderCount,
    lastRuns,
    lastSuccessfulSyncAt,
    isStale,
    isRunning: Boolean(staleRun) || syncInProgress,
  };
}
