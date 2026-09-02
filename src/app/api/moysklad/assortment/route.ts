import { NextResponse } from "next/server";
import { getAssortment } from "@/lib/moysklad";
import { toCatalogListItem } from "@/lib/moysklad-format";

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
    const data = await getAssortment(limit, offset, search);
    if (slim) {
      return NextResponse.json({ ...data, rows: data.rows.map(toCatalogListItem) });
    }
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
