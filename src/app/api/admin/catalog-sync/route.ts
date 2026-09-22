import { timingSafeEqual } from "node:crypto";
import { after, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCatalogSyncStatus, runCatalogSync, type CatalogSyncMode } from "@/lib/catalog-sync";

export const runtime = "nodejs";
// Синхронизация меняет состояние БД и файлов - кэшировать этот роут нельзя.
export const dynamic = "force-dynamic";

const MODES: CatalogSyncMode[] = ["full", "stock", "products"];

function isAuthorizedBySecret(request: Request): boolean {
  const expected = process.env.CATALOG_SYNC_SECRET;
  if (!expected) return false;

  const provided = request.headers.get("x-catalog-sync-secret") ?? "";
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  // Сравнение постоянного времени: секрет уходит в systemd-таймер и не должен
  // подбираться по времени ответа.
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

async function isAuthorizedAsAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function GET() {
  if (!(await isAuthorizedAsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await getCatalogSyncStatus());
}

/**
 * Запуск синхронизации каталога.
 *
 * Кто вызывает:
 *  - systemd-таймеры на сервере (см. scripts/deploy.sh): полный синк раз в сутки
 *    и быстрый синк остатков раз в 10 минут, авторизация по заголовку
 *    x-catalog-sync-secret;
 *  - кнопки в админке (/admin/catalog) - авторизация по сессии администратора.
 *
 * Полный синк идёт минутами (он же скачивает новые фотографии), поэтому по
 * умолчанию запускается в фоне, а ответ отдаётся сразу - иначе curl в таймере и
 * запрос из админки просто отваливались бы по таймауту.
 */
export async function POST(request: Request) {
  const authorizedBySecret = isAuthorizedBySecret(request);
  if (!authorizedBySecret && !(await isAuthorizedAsAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const requestedMode = searchParams.get("mode") ?? "full";
  const mode = MODES.includes(requestedMode as CatalogSyncMode) ? (requestedMode as CatalogSyncMode) : "full";
  // systemd должен только надёжно поставить работу в очередь и сразу завершить
  // oneshot-unit. Иначе при появлении нескольких новых товаров с фотографиями
  // curl может дождаться своего timeout, хотя синк внутри Next.js продолжится.
  // Администратор при ручном обновлении остатков по-прежнему получает результат.
  const wait = searchParams.get("wait") === "1" || (!authorizedBySecret && mode !== "full");

  const trigger = authorizedBySecret ? "cron" : "admin";

  if (!wait) {
    // Next.js 16: after() гарантирует выполнение фоновой работы после отправки
    // ответа Route Handler. Обычный `void promise` не описывает этот жизненный
    // цикл явно и при смене способа запуска приложения может быть оборван.
    after(() => runCatalogSync({ mode, trigger }));
    return NextResponse.json({ started: true, mode }, { status: 202 });
  }

  const result = await runCatalogSync({ mode, trigger });
  return NextResponse.json(result, { status: result.status === "FAILED" ? 502 : 200 });
}
