"use client";

import Link from "next/link";
import { useFavorites } from "@/components/favorites/FavoriteProvider";

type Props = {
  variant?: "icon" | "inline";
  className?: string;
  hiddenOnMobile?: boolean;
};

export default function FavoriteButton({ variant = "icon", className = "", hiddenOnMobile = false }: Props) {
  const { itemCount } = useFavorites();
  const displayClass = hiddenOnMobile ? "hidden sm:flex" : "flex";

  if (variant === "inline") {
    return (
      <Link
        href="/favorites"
        aria-label="Избранное"
        className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 ${className}`.trim()}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 1 1 6.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 0 1 0-6.364z" />
        </svg>
        <span>Избранное</span>
        <span suppressHydrationWarning className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
          {itemCount}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/favorites"
      aria-label="Избранное"
      className={`relative ${displayClass} h-10 w-10 shrink-0 items-center justify-center text-slate-500 transition hover:text-amber-600 ${className}`.trim()}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 1 1 6.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 0 1 0-6.364z" />
      </svg>
      <span suppressHydrationWarning className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
        {itemCount}
      </span>
    </Link>
  );
}
