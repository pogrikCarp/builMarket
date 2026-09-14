import { NextResponse } from "next/server";
import { getCatalogAssortment, getCatalogList } from "@/lib/catalog-db";

// Данные берутся из локального зеркала каталога (см. src/lib/catalog-db.ts), а
// не из МойСклад: этот роут вызывают браузер каталога и поиск, то есть частота
// его вызовов равна активности посетителей - обращаться на каждый такой вызов к
// чужому API нельзя (именно так и набирались сотни запросов в минуту).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "100");
  const offset = Number(searchParams.get("offset") ?? "0");
  const search = searchParams.get("search") ?? undefined;
  // ?slim=1 - используется браузером каталога (CatalogBrowser), которому не нужны
  // description/полные объекты изображений/атрибутов на каждый товар списком в сотню
  // позиций. Остальные потребители (поиск, админка акций) продолжают получать
  // полный MoyskladAssortmentItem без изменений.
  const slim = searchParams.get("slim") === "1";

  try {
    if (slim) {
      const { rows, total, limit: usedLimit, offset: usedOffset } = await getCatalogList({ limit, offset, search });
      return NextResponse.json({ rows, meta: { size: total, limit: usedLimit, offset: usedOffset } });
    }
    return NextResponse.json(await getCatalogAssortment({ limit, offset, search }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
