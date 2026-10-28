"use client";

import Image from "next/image";
import Link from "next/link";
import { resolveHeaderTheme, type HeaderCampaign } from "@/lib/header-campaign";

export default function CampaignRibbon({ campaign, hasPromos, preview = false }: { campaign: HeaderCampaign; hasPromos: boolean; preview?: boolean }) {
  const theme = resolveHeaderTheme(campaign);
  if (!theme) return null;
  const buttonClass = "inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-5";
  return (
    <div data-header-campaign={campaign.theme} style={{ backgroundColor: theme.background, color: theme.color }}>
      <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="pointer-events-none relative h-9 w-36 shrink-0 select-none" aria-hidden="true">
            <Image src={theme.image} alt="" fill sizes="144px" unoptimized className="object-contain" />
          </div>
          <p className="hidden min-w-0 text-xs font-medium sm:block">{theme.caption}</p>
        </div>
        {hasPromos && (preview
          ? <span className={buttonClass} style={{ backgroundColor: theme.buttonColor }}>{theme.buttonLabel}<span aria-hidden="true">→</span></span>
          : <Link href="/catalog?section=promo" prefetch={false} className={buttonClass} style={{ backgroundColor: theme.buttonColor }} aria-label={`${theme.buttonLabel} — товары по акции`}>{theme.buttonLabel}<span aria-hidden="true">→</span></Link>)}
        <span className="sr-only">{theme.name}</span>
      </div>
    </div>
  );
}
