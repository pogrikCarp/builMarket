import { prisma } from "@/lib/prisma";
import { EMPTY_HEADER_CAMPAIGN, isHeaderTheme, type HeaderCampaignState } from "./header-campaign";

export async function getHeaderCampaignState(): Promise<HeaderCampaignState> {
  const [saved, promos] = await Promise.all([
    prisma.headerCampaign.findUnique({ where: { id: "main" } }),
    prisma.promoItem.findMany({ where: { active: true }, select: { productId: true } }),
  ]);
  // Match the promo catalog: active entries pointing to existing, unarchived products.
  const product = promos.length ? await prisma.catalogProduct.findFirst({
    where: { id: { in: promos.map((item) => item.productId) }, archived: false }, select: { id: true },
  }) : null;
  return {
    campaign: saved ? {
      theme: isHeaderTheme(saved.theme) ? saved.theme : "none",
      customImage: saved.customImage, customTitle: saved.customTitle, buttonLabel: saved.buttonLabel,
    } : EMPTY_HEADER_CAMPAIGN,
    hasPromos: Boolean(product),
  };
}
