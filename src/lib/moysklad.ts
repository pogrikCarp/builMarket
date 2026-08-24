import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = `https://api.moysklad.ru/api/remap/1.2`;
const ENV_FILES = [".env.local", ".env", "envir.env"];

// МойСклад отключает доступ к API при слишком высокой частоте запросов (лимит по
// тарифу, ошибки 429). Раньше все запросы шли с cache: "no-store", то есть
// абсолютно каждый визит на каталог/товар/поиск бил в МойСклад напрямую - при
// параллельных посетителях и автоматических prefetch-запросах Next.js это легко
// превышало лимит и МойСклад блокировал токен целиком. Кэшируем ответы на стороне
// Next.js (Data Cache) на непродолжительное время - изменения в МойСклад всё ещё
// попадают на сайт в течение минуты, но повторные запросы разных посетителей
// не долбят API заново.
const MOYSKLAD_REVALIDATE_SECONDS = 60;
const MOYSKLAD_IMAGE_REVALIDATE_SECONDS = 3600;
// Для sitemap.xml не нужны изображения/атрибуты - только id, поэтому кэшируем
// значительно дольше обычного (карта сайта не обязана обновляться поминутно),
// это отдельный от каталога запрос и не должно создавать лишнюю нагрузку на МойСклад.
const MOYSKLAD_SITEMAP_REVALIDATE_SECONDS = 3600;

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

function getAuthHeaders() {
  const token = getMoyskladToken();
  if (!token) {
    throw new Error("MOYSKLAD_TOKEN is not set");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Accept-Encoding": "gzip",
  };
}

function buildUrl(path: string, params?: URLSearchParams) {
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
  await Promise.all(
    itemsNeedingImages.map(async (item) => {
      try {
        const res = await fetch(item.images!.meta.href, {
          headers: getAuthHeaders(),
          next: { revalidate: MOYSKLAD_REVALIDATE_SECONDS },
        });
        if (!res.ok) return;
        const data: { rows?: MoyskladImage[] } = await res.json();
        imagesByItemId.set(item.id, data.rows ?? []);
      } catch {
        // Фото недоступно - карточка просто покажет плейсхолдер
      }
    })
  );

  return items.map((item) => {
    const rows = imagesByItemId.get(item.id);
    if (!rows) return item;
    return { ...item, images: { ...item.images!, rows } };
  });
}

export async function getAssortment(
  limit = 100,
  offset = 0,
  search?: string
): Promise<MoyskladAssortmentResponse> {
  const params = new URLSearchParams();
  params.append("limit", String(limit));
  params.append("offset", String(offset));
  params.append("expand", "productFolder,productFolder.productFolder,images,attributes");
  if (search) params.append("search", search);

  const url = buildUrl("/entity/assortment", params);

  const res = await fetch(url, {
    headers: getAuthHeaders(),
    next: { revalidate: MOYSKLAD_REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    throw new Error(`MoySklad API error: ${res.status} ${await res.text()}`);
  }

  const data: MoyskladAssortmentResponse = await res.json();
  data.rows = await enrichItemsWithImages(data.rows);
  return data;
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
  const params = new URLSearchParams();
  params.append("expand", "productFolder,productFolder.productFolder,images,attributes");

  const typesToTry = knownType
    ? [knownType, ...ASSORTMENT_ENTITY_TYPES.filter((type) => type !== knownType)]
    : ASSORTMENT_ENTITY_TYPES;

  let lastError: Error | null = null;
  for (const type of typesToTry) {
    const url = buildUrl(`/entity/${type}/${id}`, params);
    const res = await fetch(url, {
      headers: getAuthHeaders(),
      next: { revalidate: MOYSKLAD_REVALIDATE_SECONDS },
    });
    if (res.ok) return res.json();
    if (res.status !== 404) {
      lastError = new Error(`MoySklad API error: ${res.status} ${await res.text()}`);
      break;
    }
  }

  throw lastError ?? new Error("Товар не найден");
}

/**
 * Скачивает байты изображения из МойСклад с авторизацией по токену.
 * Принимает только ссылки на сам МойСклад API - защита от использования
 * прокси-роута как открытого релея на произвольные адреса.
 */
export async function fetchMoyskladImageBytes(href: string) {
  if (!href.startsWith(BASE_URL)) {
    throw new Error("Недопустимый адрес изображения");
  }

  const res = await fetch(href, {
    headers: { ...getAuthHeaders(), Accept: "image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5" },
    next: { revalidate: MOYSKLAD_IMAGE_REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`MoySklad API error: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = await res.arrayBuffer();
  return { buffer, contentType };
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
  // МойСклад отдаёт довольно "тяжёлые" строки даже без expand (~8КБ на товар),
  // поэтому лимит меньше, чем в getAssortment - иначе один ответ превышает лимит
  // Next.js Data Cache в 2МБ на запись и не кэшируется вовсе.
  const limit = 200;
  let offset = 0;
  let total = Infinity;
  const ids: string[] = [];

  while (offset < total && ids.length < maxItems) {
    const params = new URLSearchParams();
    params.append("limit", String(limit));
    params.append("offset", String(offset));
    const url = buildUrl("/entity/assortment", params);
    const res = await fetch(url, {
      headers: getAuthHeaders(),
      next: { revalidate: MOYSKLAD_SITEMAP_REVALIDATE_SECONDS },
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
}

export async function getProductFolders(): Promise<MoyskladProductFolderResponse> {
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
    const res = await fetch(url, {
      headers: getAuthHeaders(),
      next: { revalidate: MOYSKLAD_REVALIDATE_SECONDS },
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
}

export async function getAssortmentByFolder(
  folderHref: string,
  limit = 100,
  offset = 0
): Promise<MoyskladAssortmentResponse> {
  const params = new URLSearchParams();
  params.append("limit", String(limit));
  params.append("offset", String(offset));
  // withSubFolders=true (значение по умолчанию в МойСклад, но задаём явно) гарантирует,
  // что при выборе раздела в выдачу попадут и товары всех его подкатегорий.
  params.append("filter", `productFolder=${folderHref};withSubFolders=true`);
  params.append("expand", "productFolder,productFolder.productFolder,images,attributes");
  const url = buildUrl("/entity/assortment", params);
  const res = await fetch(url, {
    headers: getAuthHeaders(),
    next: { revalidate: MOYSKLAD_REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`MoySklad API error: ${res.status} ${await res.text()}`);
  }
  const data: MoyskladAssortmentResponse = await res.json();
  data.rows = await enrichItemsWithImages(data.rows);
  return data;
}
