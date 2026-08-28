import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { moyskladFetch } from "./moysklad-limiter";

const BASE_URL = `https://api.moysklad.ru/api/remap/1.2`;
const ENV_FILES = [".env.local", ".env", "envir.env"];

// МойСклад отключает доступ к API при слишком высокой частоте запросов (лимит по
// тарифу, ошибки 429). Кэшируем ответы (см. withMemoryCache ниже) на непродолжительное
// время - изменения в МойСклад всё ещё попадают на сайт в течение минуты, но повторные
// запросы разных посетителей (или открытие поиска/переключение раздела) не долбят API заново.
const MOYSKLAD_REVALIDATE_SECONDS = 60;
const MOYSKLAD_IMAGE_REVALIDATE_SECONDS = 3600;
// Для sitemap.xml не нужны изображения/атрибуты - только id, поэтому кэшируем
// значительно дольше обычного (карта сайта не обязана обновляться поминутно),
// это отдельный от каталога запрос и не должно создавать лишнюю нагрузку на МойСклад.
const MOYSKLAD_SITEMAP_REVALIDATE_SECONDS = 3600;
// Сколько максимум ждём подгрузку фотографий для карточек каталога, прежде чем
// отдать ответ пользователю. Если кэш "холодный" (перезапуск сервера, одновременное
// истечение TTL у многих товаров) и нужно догрузить сотни фото - лимитер запросов
// (moysklad-limiter.ts) сам аккуратно "размажет" их по времени в фоне, не блокируя
// текущий ответ и не нарушая лимиты МойСклад. Часть карточек в эту секунду покажется
// без фото - на СЛЕДУЮЩЕМ обновлении страницы (кэш живёт MOYSKLAD_IMAGE_REVALIDATE_SECONDS)
// фото уже будут закэшированы фоновой догрузкой.
const ENRICH_IMAGES_TIME_BUDGET_MS = 4000;

type CacheEntry<T> = { value: T; expiresAt: number };

// Собственный кэш в памяти процесса для "тяжёлых" запросов к МойСклад (весь
// ассортимент, товары раздела, список папок, карточка товара). Раньше кэширование
// делалось только через `fetch(..., { next: { revalidate } })`, но встроенный Data
// Cache Next.js молча ОТКАЗЫВАЕТСЯ кэшировать ответы больше ~2МБ ("items over 2MB
// can not be cached" - это видно в логах билда/сервера) - а ответы МойСклад с
// expand=images,attributes легко превышают это ограничение уже на паре сотен
// товаров. Из-за этого revalidate по факту не работал для каталога и поиска, и
// КАЖДЫЙ визит на /catalog, открытие поиска (SearchOverlay) или клик по разделу
// слева бил напрямую в МойСклад - это и приводило к повторным блокировкам JSON API
// (429) после каждой разблокировки токена.
//
// Процесс приложения запущен постоянно на сервере (systemd), поэтому обычный Map
// с TTL в памяти работает надёжно и не имеет ограничения по размеру записи.
// Дополнительно дедуплицируем параллельные запросы с одинаковым ключом (например,
// когда несколько посетителей открывают каталог одновременно сразу после
// перезапуска сервера, когда кэш ещё пуст) - иначе они бы независимо ударили в API.
// Верхняя граница числа записей в кэше - защита от неограниченного роста памяти
// (например, если каждый посещённый товар добавляет свой ключ product:{id}).
// При превышении удаляем самые старые записи (Map хранит порядок вставки).
const MAX_CACHE_ENTRIES = 5000;

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

async function withMemoryCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  shouldCache: (value: T) => boolean = () => true
): Promise<T> {
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const inFlight = inFlightRequests.get(key) as Promise<T> | undefined;
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const value = await fetcher();
      if (shouldCache(value)) {
        if (memoryCache.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = memoryCache.keys().next().value;
          if (oldestKey !== undefined) memoryCache.delete(oldestKey);
        }
        memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
      }
      return value;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

function getTokenFromFile() {
  for (const fileName of ENV_FILES) {
    const filePath = join(process.cwd(), fileName);
    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, "utf8");
    const match = content.match(/^MOYSKLAD_TOKEN\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function getMoyskladToken() {
  return process.env.MOYSKLAD_TOKEN || getTokenFromFile();
}

export type MoyskladProductFolder = {
  meta: { href: string; type: string };
  id: string;
  name: string;
  pathName?: string;
  productFolder?: { meta: { href: string; type?: string }; name?: string };
};

export type MoyskladProductFolderResponse = {
  rows: MoyskladProductFolder[];
  meta: { size: number; limit: number; offset: number };
};

export type MoyskladImageSize = {
  href: string;
  mediaType?: string;
};

export type MoyskladImage = {
  meta: { href: string; downloadHref?: string; mediaType?: string };
  title?: string;
  filename?: string;
  miniature?: MoyskladImageSize;
  tiny?: MoyskladImageSize;
};

export type MoyskladAttributeValue = {
  id: string;
  name: string;
  type: string;
  value?: string | number | boolean | { name?: string; value?: string } | null;
};

export type MoyskladAssortmentItem = {
  meta: {
    href: string;
    type: string;
  };
  id: string;
  name: string;
  code?: string;
  article?: string;
  description?: string;
  salePrices?: {
    value: number;
    currency: { name: string };
  }[];
  quantity?: number;
  uom?: { name: string };
  productFolder?: {
    meta: { href: string; type: string };
    id?: string;
    name?: string;
    pathName?: string;
    productFolder?: { meta: { href: string; type: string }; id?: string; name?: string };
  };
  images?: {
    meta: { href: string; size?: number };
    rows?: MoyskladImage[];
  };
  attributes?: MoyskladAttributeValue[];
};

export type MoyskladAssortmentResponse = {
  rows: MoyskladAssortmentItem[];
  meta: {
    size: number;
    limit: number;
    offset: number;
    total?: number;
  };
};

export function getAuthHeaders() {
  const token = getMoyskladToken();
  if (!token) {
    throw new Error("MOYSKLAD_TOKEN is not set");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Accept-Encoding": "gzip",
  };
}

export function isMoyskladConfigured() {
  return Boolean(getMoyskladToken());
}

export function buildUrl(path: string, params?: URLSearchParams) {
  const query = params ? `?${params.toString()}` : "";
  return `${BASE_URL}${path}${query}`;
}

/**
 * В списочных ответах (assortment/product и т.п.) МойСклад отдаёт для поля
 * images только meta.size (сколько всего изображений), а сами строки (rows) -
 * то есть ссылки на превью - не разворачивает, даже если указан expand=images.
 * Поэтому для карточек в каталоге нужно дозапросить строки отдельно, но только
 * у тех товаров, у которых size > 0 - у остальных изображений нет и запрос не нужен.
 */
async function enrichItemsWithImages(
  items: MoyskladAssortmentItem[]
): Promise<MoyskladAssortmentItem[]> {
  const itemsNeedingImages = items.filter(
    (item) => (item.images?.meta?.size ?? 0) > 0 && !item.images?.rows?.length
  );
  if (itemsNeedingImages.length === 0) return items;

  const imagesByItemId = new Map<string, MoyskladImage[]>();
  const tasks = itemsNeedingImages.map(async (item) => {
    try {
      const rows = await withMemoryCache(
        `item-images:${item.id}`,
        MOYSKLAD_IMAGE_REVALIDATE_SECONDS * 1000,
        async () => {
          const res = await moyskladFetch(item.images!.meta.href, {
            headers: getAuthHeaders(),
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`MoySklad API error: ${res.status}`);
          const data: { rows?: MoyskladImage[] } = await res.json();
          return data.rows ?? [];
        }
      );
      imagesByItemId.set(item.id, rows);
    } catch {
      // Фото недоступно - карточка просто покажет плейсхолдер
    }
  });

  // Не блокируем ответ пользователю на всё время догрузки (при холодном кэше это
  // могут быть сотни товаров, а лимитер запросов намеренно "размазывает" их по времени
  // - см. комментарий у ENRICH_IMAGES_TIME_BUDGET_MS). Задачи, не успевшие завершиться
  // за отведённый бюджет, продолжают выполняться в фоне и просто прогревают кэш
  // (withMemoryCache) для следующего запроса.
  await Promise.race([
    Promise.allSettled(tasks),
    new Promise((resolve) => setTimeout(resolve, ENRICH_IMAGES_TIME_BUDGET_MS)),
  ]);

  return items.map((item) => {
    const rows = imagesByItemId.get(item.id);
    if (!rows) return item;
    return { ...item, images: { ...item.images!, rows } };
  });
}

// Спецсимволы синтаксиса фильтра МойСклад (~ ; = < > !) вырезаем из
// пользовательской поисковой строки, чтобы она не могла сломать сам синтаксис
// фильтра или случайно добавить постороннее условие.
function sanitizeFilterSearchValue(value: string): string {
  return value.replace(/[~;=<>!]/g, " ").replace(/\s+/g, " ").trim();
}

export async function getAssortment(
  limit = 100,
  offset = 0,
  search?: string
): Promise<MoyskladAssortmentResponse> {
  const cacheKey = `assortment:${limit}:${offset}:${search ?? ""}`;
  return withMemoryCache(cacheKey, MOYSKLAD_REVALIDATE_SECONDS * 1000, async () => {
    const params = new URLSearchParams();
    params.append("limit", String(limit));
    params.append("offset", String(offset));
    params.append("expand", "productFolder,productFolder.productFolder,images,attributes");
    // ВАЖНО: параметр search= у entity/assortment в МойСклад на практике не
    // фильтрует выборку вообще (проверено напрямую на реальном аккаунте -
    // возвращает все товары независимо от текста запроса, включая заведомо
    // несуществующие строки). Из-за этого поиск товара, например, по бренду
    // "edon" в админке акций выдавал случайные первые товары каталога.
    // filter=name~... (оператор "подобие"/contains) на том же эндпоинте
    // работает корректно и даёт настоящий поиск по подстроке в названии.
    const safeSearch = search ? sanitizeFilterSearchValue(search) : "";
    if (safeSearch) params.append("filter", `name~${safeSearch}`);

    const url = buildUrl("/entity/assortment", params);

    const res = await moyskladFetch(url, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`MoySklad API error: ${res.status} ${await res.text()}`);
    }

    const data: MoyskladAssortmentResponse = await res.json();
    data.rows = await enrichItemsWithImages(data.rows);
    return data;
  });
}

// entity/assortment - это комбинированный отчёт "для чтения" и не отдаёт единичный
// товар по id (эндпоинта entity/assortment/{id} не существует). Чтобы получить один
// товар, нужно обращаться к конкретному типу сущности - entity/product/{id},
// entity/variant/{id}, entity/bundle/{id} и т.д. Тип обычно известен заранее
// (передаётся из ссылки на карточку), но на случай прямого перехода по ссылке
// перебираем все варианты.
const ASSORTMENT_ENTITY_TYPES = ["product", "variant", "bundle", "service", "consumable"];

export async function getProductById(
  id: string,
  knownType?: string
): Promise<MoyskladAssortmentItem> {
  const cacheKey = `product:${id}:${knownType ?? ""}`;
  return withMemoryCache(cacheKey, MOYSKLAD_REVALIDATE_SECONDS * 1000, async () => {
    const params = new URLSearchParams();
    params.append("expand", "productFolder,productFolder.productFolder,images,attributes");

    const typesToTry = knownType
      ? [knownType, ...ASSORTMENT_ENTITY_TYPES.filter((type) => type !== knownType)]
      : ASSORTMENT_ENTITY_TYPES;

    let lastError: Error | null = null;
    for (const type of typesToTry) {
      const url = buildUrl(`/entity/${type}/${id}`, params);
      const res = await moyskladFetch(url, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      if (res.ok) return res.json();
      if (res.status !== 404) {
        lastError = new Error(`MoySklad API error: ${res.status} ${await res.text()}`);
        break;
      }
    }

    throw lastError ?? new Error("Товар не найден");
  });
}

/**
 * Скачивает байты изображения из МойСклад с авторизацией по токену.
 * Принимает только ссылки на сам МойСклад API - защита от использования
 * прокси-роута как открытого релея на произвольные адреса.
 */
// Верхняя граница размера картинки, которую храним в памяти процесса - крупные
// исходники (>3МБ) не кэшируем на сервере, чтобы не раздувать память при большом
// каталоге, но всё равно отдаём их через лимитер (защита от burst остаётся).
const MAX_CACHEABLE_IMAGE_BYTES = 3 * 1024 * 1024;

export async function fetchMoyskladImageBytes(href: string) {
  if (!href.startsWith(BASE_URL)) {
    throw new Error("Недопустимый адрес изображения");
  }

  return withMemoryCache(
    `image-bytes:${href}`,
    MOYSKLAD_IMAGE_REVALIDATE_SECONDS * 1000,
    async () => {
      const res = await moyskladFetch(href, {
        headers: { ...getAuthHeaders(), Accept: "image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5" },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`MoySklad API error: ${res.status}`);
      }

      const contentType = res.headers.get("content-type") ?? "image/jpeg";
      const buffer = await res.arrayBuffer();
      return { buffer, contentType };
    },
    (value) => value.buffer.byteLength <= MAX_CACHEABLE_IMAGE_BYTES
  );
}

// Чистые функции-форматтеры (без node:fs) вынесены в moysklad-format.ts,
// чтобы их можно было безопасно импортировать из клиентских компонентов.
export { getMoyskladImageProxyUrl, getItemThumbnailUrl, getItemGalleryUrls, formatAttributeValue } from "./moysklad-format";

/**
 * Лёгкий список id товаров для sitemap.xml - без expand=images,attributes,productFolder
 * и без enrichItemsWithImages, чтобы не плодить сотни дополнительных запросов
 * к МойСклад (см. комментарий про 429 выше). Достаточно id, чтобы построить
 * ссылку /catalog/{id}.
 */
export async function getAssortmentIdsForSitemap(maxItems = 5000): Promise<string[]> {
  const cacheKey = `sitemap-ids:${maxItems}`;
  return withMemoryCache(cacheKey, MOYSKLAD_SITEMAP_REVALIDATE_SECONDS * 1000, async () => {
    // МойСклад отдаёт довольно "тяжёлые" строки даже без expand (~8КБ на товар),
    // поэтому лимит меньше, чем в getAssortment.
    const limit = 200;
    let offset = 0;
    let total = Infinity;
    const ids: string[] = [];

    while (offset < total && ids.length < maxItems) {
      const params = new URLSearchParams();
      params.append("limit", String(limit));
      params.append("offset", String(offset));
      const url = buildUrl("/entity/assortment", params);
      const res = await moyskladFetch(url, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`MoySklad API error: ${res.status} ${await res.text()}`);
      }
      const data: { rows: { id: string }[]; meta: { size: number } } = await res.json();
      ids.push(...data.rows.map((row) => row.id));
      total = data.meta.size;
      offset += limit;
    }

    return ids.slice(0, maxItems);
  });
}

export async function getProductFolders(): Promise<MoyskladProductFolderResponse> {
  return withMemoryCache("product-folders", MOYSKLAD_REVALIDATE_SECONDS * 1000, async () => {
    const limit = 1000;
    let offset = 0;
    const rows: MoyskladProductFolder[] = [];
    let total = Infinity;

    while (offset < total) {
      const params = new URLSearchParams();
      params.append("limit", String(limit));
      params.append("offset", String(offset));
      params.append("order", "name,asc");
      params.append("expand", "productFolder");
      const url = buildUrl("/entity/productfolder", params);
      const res = await moyskladFetch(url, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`MoySklad API error: ${res.status} ${await res.text()}`);
      }
      const page: MoyskladProductFolderResponse = await res.json();
      rows.push(...page.rows);
      total = page.meta.size;
      offset += limit;
    }

    return {
      rows,
      meta: { size: rows.length, limit, offset: 0 },
    };
  });
}

export async function getAssortmentByFolder(
  folderHref: string,
  limit = 100,
  offset = 0
): Promise<MoyskladAssortmentResponse> {
  const cacheKey = `assortment-by-folder:${folderHref}:${limit}:${offset}`;
  return withMemoryCache(cacheKey, MOYSKLAD_REVALIDATE_SECONDS * 1000, async () => {
    const params = new URLSearchParams();
    params.append("limit", String(limit));
    params.append("offset", String(offset));
    // withSubFolders=true (значение по умолчанию в МойСклад, но задаём явно) гарантирует,
    // что при выборе раздела в выдачу попадут и товары всех его подкатегорий.
    params.append("filter", `productFolder=${folderHref};withSubFolders=true`);
    params.append("expand", "productFolder,productFolder.productFolder,images,attributes");
    const url = buildUrl("/entity/assortment", params);
    const res = await moyskladFetch(url, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`MoySklad API error: ${res.status} ${await res.text()}`);
    }
    const data: MoyskladAssortmentResponse = await res.json();
    data.rows = await enrichItemsWithImages(data.rows);
    return data;
  });
}
