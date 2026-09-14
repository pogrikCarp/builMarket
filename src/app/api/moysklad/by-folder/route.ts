import { NextResponse } from "next/server";
import { getCatalogAssortment, getCatalogList } from "@/lib/catalog-db";

// Товары раздела - из локального зеркала каталога (см. src/lib/catalog-db.ts).
// Раньше каждый клик по категории в каталоге уходил запросом в МойСклад.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folderHref = searchParams.get("folderHref");
  const limit = Number(searchParams.get("limit") ?? "100");
  const offset = Number(searchParams.get("offset") ?? "0");
  // См. комментарий в /api/moysklad/assortment - тот же облегчённый формат для CatalogBrowser.
  const slim = searchParams.get("slim") === "1";

  if (!folderHref) {
    return NextResponse.json({ error: "folderHref is required" }, { status: 400 });
  }

  try {
    if (slim) {
      const { rows, total, limit: usedLimit, offset: usedOffset } = await getCatalogList({
        folderHref,
        limit,
        offset,
      });
      return NextResponse.json({ rows, meta: { size: total, limit: usedLimit, offset: usedOffset } });
    }
    return NextResponse.json(await getCatalogAssortment({ folderHref, limit, offset }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
