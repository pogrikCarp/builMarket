import { NextResponse } from "next/server";
import { getProductFolders } from "@/lib/moysklad";

export async function GET() {
  try {
    const data = await getProductFolders();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
