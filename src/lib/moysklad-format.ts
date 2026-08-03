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
