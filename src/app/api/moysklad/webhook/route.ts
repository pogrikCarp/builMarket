import { NextResponse } from "next/server";
import { runCatalogSync } from "@/lib/catalog-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

type MoyskladWebhookBody = {
  events?: { meta?: { href?: string; type?: string }; action?: string }[];
};

/**
 * Вебхук МойСклад об изменении товара: сразу подтягивает изменённые позиции в
 * локальное зеркало каталога, не дожидаясь планового синка.
 *
 * Это необязательная, но полезная настройка: без неё правки в МойСклад попадают
 * на сайт в течение 10 минут (синк остатков и цен) либо суток (фото, описания,
 * характеристики). С вебхуком - за секунды.
 *
 * Как включить (МойСклад -> Настройки -> Обмен данными -> Вебхуки):
 *   URL: https://marketdomstroy.ru/api/moysklad/webhook?secret=<CATALOG_SYNC_SECRET>
 *   Сущность: Товар (при необходимости также Модификация, Комплект)
 *   Действия: Создание, Изменение, Удаление
 *
 * МойСклад ждёт быстрый ответ и повторяет доставку при таймауте, поэтому саму
 * синхронизацию запускаем в фоне и сразу отвечаем 200.
 */
export async function POST(request: Request) {
  const expected = process.env.CATALOG_SYNC_SECRET;
  const { searchParams } = new URL(request.url);
  if (!expected || searchParams.get("secret") !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: MoyskladWebhookBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const productIds = Array.from(
    new Set(
      (body.events ?? [])
        .map((event) => event.meta?.href?.match(UUID_RE)?.[0])
        .filter((id): id is string => Boolean(id))
    )
  );

  if (productIds.length === 0) {
    return NextResponse.json({ ok: true, updated: 0 });
  }

  void runCatalogSync({ mode: "products", trigger: "webhook", productIds });
  return NextResponse.json({ ok: true, queued: productIds.length });
}
