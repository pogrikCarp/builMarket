import { NextResponse } from "next/server";
import { getAssortmentByFolder } from "@/lib/moysklad";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folderHref = searchParams.get("folderHref");
  const limit = Number(searchParams.get("limit") ?? "100");
  const offset = Number(searchParams.get("offset") ?? "0");

  if (!folderHref) {
    return NextResponse.json({ error: "folderHref is required" }, { status: 400 });
  }

  try {
    const data = await getAssortmentByFolder(folderHref, limit, offset);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
