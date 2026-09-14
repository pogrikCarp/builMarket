import { prisma } from "@/lib/prisma";
import { getCatalogItemsByIds } from "@/lib/catalog-db";
import type { MoyskladAssortmentItem } from "@/lib/moysklad";

export type ResolvedPromoItem = {
  promoId: string;
  oldPrice: number | null; // в копейках, как salePrices у МойСклад
  discount: number | null; // процент скидки, если есть и цена, и старая цена
  item: MoyskladAssortmentItem;
};

/**
 * Отдаёт товары блока "Акции" (главная + /catalog?section=promo): администратор в
 * админ-панели (/admin/promo) выбирает товары МойСклад и задаёт им предыдущую цену,
 * а актуальная цена/фото/наличие берутся из локального зеркала каталога - поэтому
 * карточка акции всегда ведёт на настоящую карточку товара с реальной ценой.
 * Товары, которые перестали существовать в МойСклад (удалены/сняты с продажи),
 * просто пропускаются - без ошибки для остальных.
 *
 * Блок показывается на главной - самой посещаемой странице сайта, поэтому он
 * обязан обходиться без запросов к МойСклад: цена и фото приходят из своей БД
 * (src/lib/catalog-db.ts), которую обновляет фоновый синхронизатор.
 */
export async function getResolvedPromoItems(): Promise<ResolvedPromoItem[]> {
  const promoItems = await prisma.promoItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  if (promoItems.length === 0) return [];

  const itemsById = await getCatalogItemsByIds(promoItems.map((promo) => promo.productId));

  const resolved: ResolvedPromoItem[] = [];
  for (const promo of promoItems) {
    const item = itemsById.get(promo.productId);
    if (!item) continue;
    const oldPrice = promo.oldPrice != null ? Math.round(Number(promo.oldPrice) * 100) : null;
    const price = item.salePrices?.[0]?.value;
    const discount =
      oldPrice && price && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;
    resolved.push({ promoId: promo.id, oldPrice, discount, item });
  }

  return resolved;
}
