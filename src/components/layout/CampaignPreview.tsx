"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import CampaignRibbon from "./CampaignRibbon";
import { resolveHeaderTheme, type HeaderCampaign } from "@/lib/header-campaign";

export default function CampaignPreview({ campaign }: { campaign: HeaderCampaign }) {
  const theme = resolveHeaderTheme(campaign);
  return <div className={`site-header header-preview${theme ? " site-header--themed" : ""}`} style={theme ? { "--campaign-accent": theme.accent, "--campaign-color": theme.color, "--campaign-button": theme.buttonColor, "--campaign-button-text": theme.buttonTextColor, backgroundColor: theme.background } as CSSProperties : undefined}>
    <div className="site-header__row">
      <span className="site-header__logo"><Image src="/logo.png" alt="ДомСтрой" width={1024} height={1024} sizes="76px" className="h-full w-full object-contain" /></span>
      <span className="site-header__catalog">☰ <span>Каталог</span></span>
      <span className="site-header__search">Поиск</span>
      {theme && <CampaignRibbon campaign={campaign} hasPromos preview />}
    </div>
  </div>;
}
