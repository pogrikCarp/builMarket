"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import CampaignRibbon from "./CampaignRibbon";
import { resolveHeaderTheme, type HeaderCampaign } from "@/lib/header-campaign";

export default function CampaignPreview({ campaign }: { campaign: HeaderCampaign }) {
  const theme = resolveHeaderTheme(campaign);
  return <div className={`site-header header-preview${theme ? " site-header--themed" : ""}`} style={theme ? { "--campaign-accent": theme.accent, backgroundColor: theme.background } as CSSProperties : undefined}>
    {theme && campaign.theme !== "custom" && <div className="site-header__scene" aria-hidden="true"><Image src={theme.image} alt="" fill sizes="800px" className="object-cover" /><span /></div>}
    <div className="site-header__row">
      <span className="header-preview__brand">ДС<span>ДомСтрой</span></span>
      <span className="site-header__catalog">☰ <span>Каталог</span></span>
      <span className="site-header__search">Поиск</span>
      {theme && <CampaignRibbon campaign={campaign} hasPromos preview />}
    </div>
  </div>;
}
