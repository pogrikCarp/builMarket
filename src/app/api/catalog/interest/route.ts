import { createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENT_KINDS = new Set(["VIEW", "CART", "FAVORITE"]);
const requestCounts = new Map<string, { count: number; expiresAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  if (requestCounts.size >= 10_000) {
    for (const [entryKey, entry] of requestCounts) {
      if (entry.expiresAt <= now) requestCounts.delete(entryKey);
    }
    if (requestCounts.size >= 10_000) return true;
  }
  const previous = requestCounts.get(key);
  const entry = previous && previous.expiresAt > now ? previous : { count: 0, expiresAt: now + 60_000 };
  entry.count++;
  requestCounts.set(key, entry);
  return entry.count > 120;
}

async function readBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) return text + decoder.decode();
      bytes += chunk.value.byteLength;
      if (bytes > 1024) {
        await reader.cancel();
        throw new Error("BODY_TOO_LARGE");
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigins = new Set([new URL(SITE_URL).origin, new URL(request.url).origin]);
  if (!origin || !allowedOrigins.has(origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (/bot|spider|crawler|headless|preview|lighthouse/i.test(request.headers.get("user-agent") ?? "")) {
    return NextResponse.json({ ok: true, recorded: false });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
  }
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return NextResponse.json({ ok: true, recorded: false });
  const hash = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
  // X-Real-IP задаётся nginx; необработанные адреса не сохраняем в БД/логах.
  const ip = request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "unknown";
  if (isRateLimited(hash(`ip:${ip}`))) {
    return NextResponse.json({ error: "Too many events" }, { status: 429 });
  }

  try {
    const body = JSON.parse(await readBody(request));
    if (!body || typeof body !== "object" || typeof body.productId !== "string"
      || typeof body.visitorId !== "string" || !UUID_RE.test(body.productId)
      || !UUID_RE.test(body.visitorId) || !EVENT_KINDS.has(body.kind)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }
    const visitorHash = hash(`visitor:${body.visitorId.toLowerCase()}`);
    const day = new Date().toISOString().slice(0, 10);
    // Один параметризованный запрос: неизвестные/архивные товары не записываем,
    // повторные сигналы того же посетителя за сутки не увеличивают рейтинг.
    const recorded = await prisma.$executeRaw`
      INSERT INTO "CatalogInterestEvent" (id, "productId", "visitorHash", kind, day)
      SELECT ${randomUUID()}, ${body.productId}, ${visitorHash}, ${body.kind}, ${day}::date
      WHERE EXISTS (
        SELECT 1 FROM "CatalogProduct" WHERE id = ${body.productId} AND archived = false
      )
      ON CONFLICT ("productId", "visitorHash", kind, day) DO NOTHING
    `;
    return NextResponse.json({ ok: true, recorded: recorded > 0 });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    if (error instanceof Error && error.message === "BODY_TOO_LARGE") {
      return NextResponse.json({ error: "Event is too large" }, { status: 413 });
    }
    console.error("[catalog-interest] Не удалось сохранить сигнал интереса");
    return NextResponse.json({ error: "Could not record event" }, { status: 503 });
  }
}
