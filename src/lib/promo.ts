import { prisma } from "@/lib/prisma";
import { getProductById, type MoyskladAssortmentItem } from "@/lib/moysklad";

export type ResolvedPromoItem = {
  promoId: string;
  oldPrice: number | null; // в копейках, как salePrices у МойСклад
  discount: number | null; // процент скидки, если есть и цена, и старая цена
  item: MoyskladAssortmentItem;
};

/**
 * Отдаёт товары блока "Акции" (главная + /catalog?section=promo): администратор в
 * админ-панели (/admin/promo) выбирает товары МойСклад и задаёт им предыдущую цену,
 * а актуальная цена/фото/наличие каждый раз подгружаются живыми из МойСклад - поэтому
 * карточка акции всегда ведёт на настоящую карточку товара с реальной ценой.
 * Товары, которые перестали существовать в МойСклад (удалены/сняты с продажи),
 * просто пропускаются - без ошибки для остальных.
 */
export async function getResolvedPromoItems(): Promise<ResolvedPromoItem[]> {
  const promoItems = await prisma.promoItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  if (promoItems.length === 0) return [];

  const resolved = await Promise.allSettled(
    promoItems.map(async (promo) => {
      const item = await getProductById(promo.productId);
      const oldPrice = promo.oldPrice != null ? Math.round(Number(promo.oldPrice) * 100) : null;
      const price = item.salePrices?.[0]?.value;
      const discount =
        oldPrice && price && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

      return { promoId: promo.id, oldPrice, discount, item } satisfies ResolvedPromoItem;
    })
  );

  return resolved
    .filter((result): result is PromiseFulfilledResult<ResolvedPromoItem> => result.status === "fulfilled")
    .map((result) => result.value);
}
