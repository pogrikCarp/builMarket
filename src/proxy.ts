import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type CachedRedirect = { toPath: string; permanent: boolean };

let cache: Map<string, CachedRedirect> | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 30_000;

async function getRedirectMap(): Promise<Map<string, CachedRedirect>> {
  const now = Date.now();
  if (cache && now < cacheExpiresAt) {
    return cache;
  }

  const redirects = await prisma.redirect.findMany({ where: { active: true } });
  const map = new Map<string, CachedRedirect>();
  for (const r of redirects) {
    map.set(r.fromPath, { toPath: r.toPath, permanent: r.type === "PERMANENT" });
  }

  cache = map;
  cacheExpiresAt = now + CACHE_TTL_MS;
  return map;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    const redirects = await getRedirectMap();
    const match = redirects.get(pathname);

    if (match) {
      return NextResponse.redirect(new URL(match.toPath, request.url), match.permanent ? 301 : 302);
    }
  } catch {
    // На случай сбоя БД пропускаем запрос дальше, не блокируем сайт
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico|admin).*)",
};
