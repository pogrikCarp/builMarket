// Чистые функции-хелперы без обращения к файловой системе/сети - их можно
// безопасно импортировать как из серверных, так и из клиентских компонентов.
// moysklad.ts использует node:fs для чтения токена, поэтому его нельзя
// импортировать из компонентов с "use client".
import type { MoyskladAssortmentItem, MoyskladAttributeValue } from "./moysklad";

/**
 * МойСклад отдаёт байты изображения только с авторизацией по токену, поэтому
 * прямая ссылка на api.moysklad.ru не подходит для <img>/<Image> в браузере.
 * Возвращаем адрес нашего собственного прокси-роута, который сервер запросит
 * от имени приложения и отдаст клиенту уже как обычную картинку.
 */
export function getMoyskladImageProxyUrl(href?: string | null): string | null {
  if (!href) return null;
  return `/api/moysklad/image?href=${encodeURIComponent(href)}`;
}

export function getItemThumbnailUrl(item: MoyskladAssortmentItem): string | null {
  const image = item.images?.rows?.[0];
  if (!image) return null;
  const href = image.miniature?.href ?? image.tiny?.href ?? image.meta.downloadHref ?? image.meta.href;
  return getMoyskladImageProxyUrl(href);
}

/**
 * Уменьшенные превью всех фото товара (не только первого) — используются в карточке
 * каталога, чтобы можно было пролистывать фото наведением/тапом без перехода в товар.
 */
export function getItemGalleryThumbnailUrls(item: MoyskladAssortmentItem): string[] {
  const rows = item.images?.rows ?? [];
  return rows
    .map((image) => image.miniature?.href ?? image.tiny?.href ?? image.meta.downloadHref ?? image.meta.href)
    .filter((href): href is string => Boolean(href))
    .map((href) => getMoyskladImageProxyUrl(href))
    .filter((url): url is string => Boolean(url));
}

export function getItemGalleryUrls(item: MoyskladAssortmentItem): string[] {
  const rows = item.images?.rows ?? [];
  return rows
    .map((image) => image.meta.downloadHref ?? image.meta.href)
    .filter((href): href is string => Boolean(href))
    .map((href) => getMoyskladImageProxyUrl(href))
    .filter((url): url is string => Boolean(url));
}

export function formatAttributeValue(value: MoyskladAttributeValue["value"]): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Да" : "Нет";
  if (typeof value === "object") return value.name ?? value.value ?? null;
  return null;
}

// Минимальная форма товара, которой хватает кнопке "В корзину"/сердечку избранного -
// структурно совместима и с полным MoyskladAssortmentItem (карточка товара, наборы,
// акции), и с "облегчённым" CatalogListItem ниже (список каталога), поэтому сами
// компоненты кнопок менять не пришлось.
export type MinimalCartItem = {
  id: string;
  name: string;
  article?: string;
  code?: string;
  quantity?: number;
  salePrices?: { value: number }[];
};

type FolderLike = {
  name?: string;
  pathName?: string | null;
  productFolder?: FolderLike | null;
};

const splitFolderPath = (value?: string | null) =>
  (value ?? "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

const getFolderSegments = (folder?: FolderLike | null) => {
  if (!folder?.name) return splitFolderPath(folder?.pathName);
  return [...splitFolderPath(folder.pathName), folder.name].filter(Boolean);
};

export const getFolderGroupLabel = (folder?: FolderLike | null) => {
  if (!folder) return undefined;
  if (folder.productFolder?.name) return folder.productFolder.name;
  const segments = getFolderSegments(folder);
  if (segments.length >= 2) return segments[segments.length - 2];
  return segments[0];
};

export const getFolderSubgroupLabel = (folder?: FolderLike | null) => {
  if (!folder) return undefined;
  const segments = getFolderSegments(folder);
  return segments[segments.length - 1];
};

// "Облегчённая" карточка товара для списков каталога (весь каталог/раздел может
// содержать сотни позиций). В отличие от MoyskladAssortmentItem не содержит
// description, полную цепочку productFolder, "сырые" images.rows (meta/mediaType/
// filename на каждый размер картинки) и служебные id/type атрибутов - только то,
// что реально показывает карточка. На реальном каталоге (169 товаров) это сократило
// HTML-ответ страницы /catalog примерно с 1.9МБ до заметно меньшего размера и
// соответствующе ускорило первую отрисовку и гидрацию на клиенте.
export type CatalogListItem = {
  id: string;
  type: string;
  name: string;
  article?: string;
  code?: string;
  quantity?: number;
  salePrices?: { value: number }[];
  groupLabel?: string;
  subgroupLabel?: string;
  galleryThumbnails: string[];
  attributes: { name: string; value: string }[];
};

export function toCatalogListItem(item: MoyskladAssortmentItem): CatalogListItem {
  const attributes: { name: string; value: string }[] = [];
  for (const attribute of item.attributes ?? []) {
    const value = formatAttributeValue(attribute.value);
    if (value) attributes.push({ name: attribute.name, value });
  }

  return {
    id: item.id,
    type: item.meta.type,
    name: item.name,
    article: item.article,
    code: item.code,
    quantity: item.quantity,
    // МойСклад кладёт в каждую цену ещё и полные объекты валюты/типа цены
    // (meta-ссылки, названия) - карточке нужно только само число.
    salePrices: item.salePrices?.map((price) => ({ value: price.value })),
    groupLabel: getFolderGroupLabel(item.productFolder),
    subgroupLabel: getFolderSubgroupLabel(item.productFolder),
    galleryThumbnails: getItemGalleryThumbnailUrls(item),
    attributes,
  };
}
