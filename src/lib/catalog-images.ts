// Локальное хранилище фотографий товаров.
//
// Раньше каждая картинка каталога шла через прокси-роут /api/moysklad/image,
// то есть при заходе посетителя сервер запрашивал файл у МойСклад (с токеном -
// иначе МойСклад отдать файл не может, прямую ссылку в <img> вставить нельзя).
// На странице каталога это десятки картинок, при "холодном" кэше - сотни
// запросов к чужому API за секунды. Именно такой burst и приводил к отключению
// доступа к JSON API (см. комментарий в moysklad-limiter.ts).
//
// Теперь файлы один раз скачивает фоновый синхронизатор (catalog-sync.ts) и
// кладёт в public/catalog-images. Браузер получает их как обычную статику через
// nginx - без Node.js, без токена и без обращений к МойСклад вообще. Имя файла
// считается от ссылки МойСклад (в ней зашит id файла, который меняется при
// замене фото), поэтому повторные синхронизации ничего не перекачивают.
import { createHash } from "node:crypto";
import { mkdir, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAuthHeaders, type MoyskladImage } from "./moysklad";
import { moyskladFetch } from "./moysklad-limiter";

export const CATALOG_IMAGES_URL_PREFIX = "/catalog-images";

// На сервере это симлинк на $APP_DIR/shared/catalog-images (см. scripts/deploy.sh):
// файлы переживают blue-green переключение релизов и не качаются заново после
// каждого деплоя.
// Каталог является runtime-хранилищем (на сервере это shared-симлинк), а не
// входом сборщика. Без turbopackIgnore Next.js пытался трассировать десятки
// тысяч фотографий в NFT-манифест каждого API-роута и замедлял сборку/деплой.
const CATALOG_IMAGES_DIR = path.resolve("public", "catalog-images");

// Страховка от неожиданно огромного исходника в МойСклад: карточке товара такой
// файл всё равно не нужен, а диск сервера не бесконечный (45 ГБ на текущем VPS).
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
};

export type StoredProductImage = {
  /** Локальный путь полноразмерного фото (или null, если скачать не удалось). */
  url: string | null;
  /** Локальный путь превью для карточек каталога. */
  thumbUrl: string | null;
  /** Исходные ссылки МойСклад нужны синхронизатору для повторной загрузки. */
  remoteHref?: string;
  remoteThumbHref?: string;
};

function hashHref(href: string) {
  return createHash("sha1").update(href).digest("hex").slice(0, 24);
}

// Раскладываем файлы по подкаталогам из двух символов хэша: при 5000 товаров с
// 8 фото это 40 000+ файлов, и держать их в одной папке - плохая идея для
// файловой системы и для любых операций листинга.
function resolveTargetPath(hash: string, extension: string) {
  const shard = hash.slice(0, 2);
  const fileName = `${hash}.${extension}`;
  return {
    relativeUrl: `${CATALOG_IMAGES_URL_PREFIX}/${shard}/${fileName}`,
    directory: path.join(/* turbopackIgnore: true */ CATALOG_IMAGES_DIR, shard),
    absolutePath: path.join(/* turbopackIgnore: true */ CATALOG_IMAGES_DIR, shard, fileName),
  };
}

async function findExistingFile(hash: string): Promise<string | null> {
  for (const extension of ["jpg", "png", "webp", "gif", "bmp"]) {
    const { absolutePath, relativeUrl } = resolveTargetPath(hash, extension);
    try {
      const stats = await stat(absolutePath);
      if (stats.size > 0) return relativeUrl;
    } catch {
      // файла с таким расширением нет - пробуем следующее
    }
  }
  return null;
}

/**
 * Скачивает один файл изображения, если его ещё нет на диске, и возвращает
 * локальный путь. Возвращает null, если МойСклад файл не отдал; карточка
 * временно останется без фото, а следующий фоновый синк повторит загрузку.
 */
async function ensureLocalImage(href: string): Promise<{ url: string; downloaded: boolean } | null> {
  const hash = hashHref(href);

  const existing = await findExistingFile(hash);
  if (existing) return { url: existing, downloaded: false };

  let response: Response;
  try {
    response = await moyskladFetch(href, {
      headers: { ...getAuthHeaders(), Accept: "image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5" },
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  const contentType = (response.headers.get("content-type") ?? "image/jpeg").split(";")[0].trim().toLowerCase();
  const extension = EXTENSION_BY_CONTENT_TYPE[contentType] ?? "jpg";

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) return null;

  const { directory, absolutePath, relativeUrl } = resolveTargetPath(hash, extension);
  await mkdir(directory, { recursive: true });
  // Пишем во временный файл и переименовываем: если процесс упадёт посередине,
  // на диске не останется "обрезанной" картинки, которую сайт примет за готовую.
  const temporaryPath = `${absolutePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, buffer);
  await rename(temporaryPath, absolutePath);

  return { url: relativeUrl, downloaded: true };
}

/**
 * Складывает на диск все фото одного товара и возвращает описание для БД.
 * Порядок фотографий сохраняется - он определяет главное фото карточки.
 */
export async function storeProductImages(
  rows: MoyskladImage[]
): Promise<{ images: StoredProductImage[]; downloadedCount: number }> {
  // Файлы качаем параллельно и НЕ по одному: темп всё равно задаёт общий
  // лимитер запросов к МойСклад (moysklad-limiter.ts), а последовательная
  // загрузка просто не выбирала разрешённое окно - первая синхронизация
  // каталога из-за этого шла в разы дольше, чем позволяет лимит.
  const results = await Promise.all(
    rows.map(async (row) => {
      const fullHref = row.meta.downloadHref ?? row.meta.href;
      const thumbHref = row.miniature?.href ?? row.tiny?.href ?? fullHref;
      const sameFile = thumbHref === fullHref;

      const [full, thumbOnly] = await Promise.all([
        fullHref ? ensureLocalImage(fullHref) : null,
        !sameFile && thumbHref ? ensureLocalImage(thumbHref) : null,
      ]);
      const thumb = sameFile ? full : thumbOnly;

      let downloaded = 0;
      if (full?.downloaded) downloaded++;
      if (thumb?.downloaded && thumb !== full) downloaded++;

      // Исходную ссылку сохраняем только для диагностики/повторной загрузки.
      // Посетителям она не отдаётся: браузер не должен обращаться к МойСклад.
      const image: StoredProductImage = {
        url: full?.url ?? null,
        thumbUrl: thumb?.url ?? full?.url ?? null,
        ...(full ? {} : { remoteHref: fullHref }),
        ...(thumb ? {} : thumbHref ? { remoteThumbHref: thumbHref } : {}),
      };

      return { image, downloaded };
    })
  );

  return {
    images: results.map((result) => result.image),
    downloadedCount: results.reduce((sum, result) => sum + result.downloaded, 0),
  };
}

/**
 * Удаляет с диска файлы, на которые больше не ссылается ни один товар (фото
 * заменили в МойСклад, товар удалили). Вызывается только после успешного
 * полного синка: referenced собирается по всей таблице CatalogProduct, и если
 * он пуст - ничего не удаляем, чтобы случайно не вычистить хранилище.
 */
export async function cleanupOrphanImages(referencedUrls: Set<string>): Promise<number> {
  if (referencedUrls.size === 0) return 0;

  let removed = 0;
  let shards: string[];
  try {
    shards = await readdir(CATALOG_IMAGES_DIR);
  } catch {
    return 0;
  }

  for (const shard of shards) {
    const shardPath = path.join(/* turbopackIgnore: true */ CATALOG_IMAGES_DIR, shard);
    let files: string[];
    try {
      files = await readdir(shardPath);
    } catch {
      continue;
    }

    for (const file of files) {
      const url = `${CATALOG_IMAGES_URL_PREFIX}/${shard}/${file}`;
      if (referencedUrls.has(url)) continue;
      // Недописанные .tmp файлы от упавшего синка тоже подчищаем.
      try {
        await rm(path.join(/* turbopackIgnore: true */ shardPath, file), { force: true });
        removed++;
      } catch {
        // не смогли удалить - не повод ронять синхронизацию
      }
    }
  }

  return removed;
}
