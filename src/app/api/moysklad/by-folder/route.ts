import { NextResponse } from "next/server";
import { getAssortmentByFolder } from "@/lib/moysklad";
import { toCatalogListItem } from "@/lib/moysklad-format";

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
    const data = await getAssortmentByFolder(folderHref, limit, offset);
    if (slim) {
      return NextResponse.json({ ...data, rows: data.rows.map(toCatalogListItem) });
    }
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
