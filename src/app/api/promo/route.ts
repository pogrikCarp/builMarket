import { NextResponse } from "next/server";
import { getResolvedPromoItems } from "@/lib/promo";

export async function GET() {
  try {
    const items = await getResolvedPromoItems();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
