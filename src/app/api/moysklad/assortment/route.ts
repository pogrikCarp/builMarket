import { NextResponse } from "next/server";
import { getAssortment } from "@/lib/moysklad";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "100");
  const offset = Number(searchParams.get("offset") ?? "0");
  const search = searchParams.get("search") ?? undefined;

  try {
    const data = await getAssortment(limit, offset, search);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
