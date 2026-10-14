import { prisma } from "./prisma";
import type { CatalogListItem } from "./moysklad-format";

type Popularity = NonNullable<CatalogListItem["popularity"]>;
type PopularityRow = Popularity & { productId: string };

// Общий рейтинг из локальной БД: не пересчитываем заказы на каждый клик/визит.
const CACHE_TTL_MS = 60_000;
let cached = new Map<string, Popularity>();
let expiresAt = 0;
let pending: Promise<Map<string, Popularity>> | null = null;

export function invalidateCatalogPopularity(): void {
  expiresAt = 0;
}

export async function getCatalogPopularity(): Promise<Map<string, Popularity>> {
  if (Date.now() < expiresAt) return cached;
  if (pending) return pending;

  pending = (async () => {
    try {
      const rows = await prisma.$queryRaw<PopularityRow[]>`
        SELECT stats."productId",
          SUM(stats.purchases)::double precision AS purchases,
          SUM(stats.favorites)::double precision AS favorites,
          SUM(stats."cartAdds")::double precision AS "cartAdds",
          SUM(stats.views)::double precision AS views
        FROM (
          SELECT line->>'id' AS "productId",
            SUM(CASE WHEN jsonb_typeof(line->'quantity') = 'number'
              THEN GREATEST((line->>'quantity')::double precision, 0)
              ELSE 0 END)::double precision AS purchases,
            0::double precision AS favorites,
            0::double precision AS "cartAdds",
            0::double precision AS views
          FROM "Order" AS orders
          CROSS JOIN LATERAL jsonb_array_elements(
            CASE WHEN jsonb_typeof(orders.items) = 'array' THEN orders.items ELSE '[]'::jsonb END
          ) AS line
          WHERE orders."paymentStatus" = 'PAID' AND orders.status <> 'CANCELLED'
            AND jsonb_typeof(line->'id') = 'string'
            AND COALESCE(orders."paidAt", orders."createdAt") >= NOW() - INTERVAL '90 days'
          GROUP BY line->>'id'
          UNION ALL
          SELECT "productId", 0::double precision, COUNT(*)::double precision,
            0::double precision, 0::double precision
          FROM "Favorite"
          GROUP BY "productId"
          UNION ALL
          SELECT "productId", 0::double precision,
            COUNT(*) FILTER (WHERE kind = 'FAVORITE')::double precision,
            COUNT(*) FILTER (WHERE kind = 'CART')::double precision,
            COUNT(*) FILTER (WHERE kind = 'VIEW')::double precision
          FROM "CatalogInterestEvent"
          WHERE day >= CURRENT_DATE - INTERVAL '90 days'
          GROUP BY "productId"
        ) AS stats
        GROUP BY stats."productId"
      `;
      cached = new Map(rows.map(({ productId, purchases, favorites, cartAdds, views }) => [
        productId,
        { purchases, favorites, cartAdds, views },
      ]));
    } catch (error) {
      // Сбой статистики не должен мешать открытию каталога.
      console.error("[catalog-popularity] Не удалось обновить рейтинг", error);
    }
    expiresAt = Date.now() + CACHE_TTL_MS;
    return cached;
  })();

  try {
    return await pending;
  } finally {
    pending = null;
  }
}
