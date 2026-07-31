import { NextResponse } from "next/server";
import { fetchMoyskladImageBytes } from "@/lib/moysklad";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const href = searchParams.get("href");

  if (!href) {
    return NextResponse.json({ error: "href is required" }, { status: 400 });
  }

  try {
    const { buffer, contentType } = await fetchMoyskladImageBytes(href);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        // Изображения в МойСклад меняются редко - кэшируем надолго на стороне браузера/CDN
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
