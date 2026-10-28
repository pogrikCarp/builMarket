"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import CartButton from "@/components/cart/CartButton";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import SearchOverlay from "@/components/search/SearchOverlay";
import CampaignRibbon from "./CampaignRibbon";
import { EMPTY_HEADER_CAMPAIGN, resolveHeaderTheme, type HeaderCampaignState } from "@/lib/header-campaign";

function SearchIcon() {
  return <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path strokeLinecap="round" d="m16 16 4.5 4.5" /></svg>;
}

// One sticky element owns navigation AND the campaign at every breakpoint.
export default function SiteHeader({ onRequestCallback }: { onRequestCallback?: () => void }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [decoration, setDecoration] = useState<HeaderCampaignState>({ campaign: EMPTY_HEADER_CAMPAIGN, hasPromos: false });
  const theme = resolveHeaderTheme(decoration.campaign);

  useEffect(() => {
    let mounted = true;
    fetch("/api/header-campaign", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (mounted && data?.campaign) setDecoration(data); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  return <>
    <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    <header data-site-header className={`site-header${theme ? " site-header--themed" : ""}`} style={theme ? { "--campaign-accent": theme.accent, backgroundColor: theme.background } as CSSProperties : undefined}>
      {theme && decoration.campaign.theme !== "custom" && <div className="site-header__scene" aria-hidden="true"><Image src={theme.image} alt="" fill sizes="100vw" className="object-cover" /><span /></div>}
      <div className="site-header__row">
        <Link href="/" className="site-header__logo"><Image src="/logo.png" alt="ДомСтрой" width={150} height={70} className="h-full w-auto object-contain" /></Link>
        <Link href="/catalog" aria-label="Каталог" prefetch={false} className="site-header__catalog">
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          <span>Каталог</span>
        </Link>
        <button type="button" aria-label="Поиск" onClick={() => setSearchOpen(true)} className="site-header__search"><SearchIcon /><span>Поиск по каталогу</span></button>
        <span className="site-header__spacer" />
        <button type="button" aria-label="Поиск" onClick={() => setSearchOpen(true)} className="site-header__mobile-search site-header__action"><SearchIcon /></button>
        {onRequestCallback && <div className="site-header__contact"><a href="tel:+79160045522">+7 916 004-55-22</a><button type="button" onClick={onRequestCallback}>Заказать звонок</button></div>}
        <CampaignRibbon campaign={decoration.campaign} hasPromos={decoration.hasPromos} />
        <div className="site-header__actions">
          <FavoriteButton hiddenOnMobile className="site-header__action" />
          <CartButton className="site-header__action" />
          <Link href="/login" className="site-header__action site-header__account" aria-label="Войти"><svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0" /></svg></Link>
        </div>
      </div>
    </header>
  </>;
}
