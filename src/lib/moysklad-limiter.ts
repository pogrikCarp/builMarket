// Ограничитель скорости и параллелизма для запросов к МойСклад JSON API 1.2.
//
// Почему это понадобилось: анализ report.csv от МойСклад показал burst на 800+
// запросов к /entity/product/{id}/images в течение ОДНОГО 3-секундного окна (после
// холодного старта кэша - перезапуск сервера или одновременное истечение TTL у
// многих товаров сразу). Причина - `enrichItemsWithImages` в moysklad.ts делает
// `Promise.all` по всем товарам без изображений сразу, то есть при большом каталоге
// в момент "холодного" кэша улетает не 1-2, а сотни параллельных запросов разом.
//
// МойСклад ограничивает (см. https://dev.moysklad.ru/doc/api/remap/1.2/#/restrictions):
//   - не более 5 параллельных запросов от одного пользователя/решения (жёсткий лимит,
//     не зависит от способа авторизации);
//   - лимит запросов за 3-секундный период зависит от способа аутентификации и веса
//     запроса. При авторизации по логину/паролю или токену пользователя (наш случай -
//     admin@agagamzabekov) лимит по графику ужесточается:
//       22 запроса / 3 сек - с 12.05.2026
//       15 запросов / 3 сек - с 01.09.2026
//       11 запросов / 3 сек - с 01.12.2026
//   - при >200 запросов/минуту, завершившихся ошибкой 429, за последний час МойСклад
//     ОТКЛЮЧАЕТ доступ к API целиком.
//
// Решение - единая очередь на всё приложение: не более MAX_CONCURRENT одновременных
// запросов и не более MAX_PER_WINDOW запросов в скользящем окне RATE_WINDOW_MS.
// Значения взяты с запасом ниже самого строгого будущего лимита (11/3 сек, с
// 01.12.2026), чтобы не пришлось снова править код в декабре 2026. Помимо самого
// ограничителя, основную нагрузку теперь снижает батчинг запросов (см.
// getAssortmentByIds в moysklad.ts - остаток по корзине/заказу и товары акций
// проверяются одним запросом на N товаров, а не N отдельными), поэтому очередь
// реже становится узким местом даже с этими более щедрыми значениями.
const MAX_CONCURRENT = 4;
const RATE_WINDOW_MS = 3000;
const MAX_PER_WINDOW = 8;

const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 800;
const MAX_BACKOFF_MS = 15000;

type QueueItem = { resolve: () => void };

const waitQueue: QueueItem[] = [];
const requestTimestamps: number[] = [];
let activeCount = 0;

let totalRequests = 0;
let total429 = 0;
let totalErrors = 0;

function pruneTimestamps() {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  while (requestTimestamps.length && requestTimestamps[0] < cutoff) {
    requestTimestamps.shift();
  }
}

function tryDispatch() {
  pruneTimestamps();
  while (waitQueue.length > 0 && activeCount < MAX_CONCURRENT && requestTimestamps.length < MAX_PER_WINDOW) {
    const item = waitQueue.shift()!;
    activeCount++;
    requestTimestamps.push(Date.now());
    item.resolve();
  }
  if (waitQueue.length > 0) {
    const delay = requestTimestamps.length > 0 ? Math.max(50, RATE_WINDOW_MS - (Date.now() - requestTimestamps[0]) + 10) : 50;
    setTimeout(tryDispatch, delay);
  }
}

function acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    waitQueue.push({ resolve });
    tryDispatch();
  });
}

function releaseSlot() {
  activeCount = Math.max(0, activeCount - 1);
  tryDispatch();
}

function normalizePathForLog(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "{id}");
  } catch {
    return url;
  }
}

/**
 * Обёртка над fetch() для всех запросов к api.moysklad.ru: гарантирует, что
 * приложение НИКОГДА не превысит жёсткий лимит параллельных запросов и лимит
 * за 3-секундное окно, независимо от того, сколько запросов пытаются уйти
 * одновременно из разных мест кода (список каталога, карточка товара, картинки).
 * При 429 автоматически повторяет запрос с задержкой (уважая заголовок
 * X-Lognex-Retry-After, если он есть).
 *
 * Логирует каждый исходящий запрос в stdout (виден в `journalctl`/логах systemd-сервиса)
 * в формате `[moysklad] METHOD /path -> status (Nms) | всего=N 429=N ошибок=N активно=N очередь=N`.
 */
export async function moyskladFetch(url: string, init: RequestInit, attempt = 0): Promise<Response> {
  await acquireSlot();
  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (error) {
    releaseSlot();
    totalErrors++;
    console.error(
      `[moysklad] ${init.method ?? "GET"} ${normalizePathForLog(url)} -> network error (${
        error instanceof Error ? error.message : String(error)
      }) | всего=${totalRequests} 429=${total429} ошибок=${totalErrors} активно=${activeCount} очередь=${waitQueue.length}`
    );
    throw error;
  }
  releaseSlot();

  const ms = Date.now() - startedAt;
  totalRequests++;
  if (res.status === 429) total429++;
  if (res.status >= 500) totalErrors++;

  console.log(
    `[moysklad] ${init.method ?? "GET"} ${normalizePathForLog(url)} -> ${res.status} (${ms}ms)` +
      (attempt > 0 ? ` [попытка ${attempt + 1}]` : "") +
      ` | всего=${totalRequests} 429=${total429} ошибок=${totalErrors} активно=${activeCount} очередь=${waitQueue.length}`
  );

  if (res.status === 429 && attempt < MAX_RETRIES) {
    const retryAfterHeader = res.headers.get("x-lognex-retry-after") ?? res.headers.get("retry-after");
    const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) : NaN;
    const delay = Number.isFinite(retryAfterMs) && retryAfterMs > 0
      ? Math.min(retryAfterMs, MAX_BACKOFF_MS)
      : Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return moyskladFetch(url, init, attempt + 1);
  }

  return res;
}

export function getMoyskladRequestStats() {
  return {
    totalRequests,
    total429,
    totalErrors,
    activeCount,
    queueLength: waitQueue.length,
  };
}
