import { NextResponse } from "next/server";
import { getCatalogFolders } from "@/lib/catalog-db";

// Категории - из локального зеркала каталога (см. src/lib/catalog-db.ts).
export async function GET() {
  try {
    return NextResponse.json(await getCatalogFolders());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
