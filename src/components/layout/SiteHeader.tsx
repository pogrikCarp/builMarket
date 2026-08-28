"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import CartButton from "@/components/cart/CartButton";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import SearchOverlay from "@/components/search/SearchOverlay";

/**
 * Общий хедер для внутренних страниц (каталог, товар, корзина, избранное, оформление
 * заказа) - иконки вместо текстовых ссылок гарантируют, что на мобильном экране хедер
 * не переполняется по ширине и кнопка корзины всегда видна и доступна (в отличие от
 * прежних самодельных хедеров с текстовым `nav`, из-за которых корзина уходила за
 * пределы экрана на узких экранах). Полностью повторяет хедер главной страницы
 * (см. src/app/HomeClient.tsx), чтобы навигация была единообразной на всём сайте.
 */
export default function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div className="sticky top-0 z-[80] border-b border-slate-100 bg-white shadow-lg shadow-slate-900/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:gap-5 sm:px-4">
          <Link href="/" className="flex shrink-0 items-center">
            <Image src="/logo.png" alt="ДомСтрой" width={150} height={70} className="h-12 w-auto object-contain sm:h-14" />
          </Link>
          <Link
            href="/catalog"
            prefetch={false}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-slate-800 transition hover:text-amber-600 sm:px-3"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="hidden sm:inline">Каталог</span>
          </Link>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="relative hidden h-10 flex-1 items-center border border-slate-100 bg-slate-50 px-4 pr-10 text-left text-sm text-slate-400 transition hover:border-amber-300 hover:bg-white sm:flex"
          >
            Поиск
            <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>
          <div className="flex-1 sm:hidden" />
          <button
            type="button"
            aria-label="Поиск"
            onClick={() => setSearchOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center text-slate-500 transition hover:text-amber-600 sm:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>
          <FavoriteButton hiddenOnMobile />
          <CartButton />
          <Link href="/login" className="flex h-10 w-10 items-center justify-center text-slate-500 transition hover:text-amber-600" aria-label="Войти">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  );
}
