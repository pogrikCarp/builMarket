"use client";

import Image from "next/image";
import Link from "next/link";
import { resolveHeaderTheme, type HeaderCampaign } from "@/lib/header-campaign";

export function CampaignIdentity({ campaign }: { campaign: HeaderCampaign }) {
  const theme = resolveHeaderTheme(campaign);
  if (!theme) return null;
  if (campaign.theme === "custom") return <div className="campaign__custom"><Image src={theme.image} alt={theme.name} fill sizes="144px" unoptimized className="object-contain" /></div>;
  return <div className="campaign__identity">
    <div className="campaign__art" aria-hidden="true"><Image src={theme.image} alt="" fill sizes="220px" className="object-cover" /></div>
    <div className="campaign__copy"><span className="campaign__eyebrow">{theme.eyebrow}</span>
    <span className="campaign__title">{theme.title}</span></div>
  </div>;
}

export default function CampaignRibbon({ campaign, hasPromos, preview = false }: { campaign: HeaderCampaign; hasPromos: boolean; preview?: boolean }) {
  const theme = resolveHeaderTheme(campaign);
  if (!theme) return null;
  return <div className="campaign" data-header-campaign={campaign.theme}>
    <CampaignIdentity campaign={campaign} />
    {hasPromos && (preview
      ? <span className="campaign__button">{theme.buttonLabel}</span>
      : <Link href="/catalog?section=promo" prefetch={false} className="campaign__button" aria-label={`${theme.buttonLabel} — товары по акции`}>{theme.buttonLabel}</Link>)}
  </div>;
}
