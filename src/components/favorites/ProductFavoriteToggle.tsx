"use client";

import { useFavorites } from "@/components/favorites/FavoriteProvider";
import type { MoyskladAssortmentItem } from "@/lib/moysklad";

type Props = {
  item: MoyskladAssortmentItem;
  imageUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
};

export default function ProductFavoriteToggle({ item, imageUrl, size = "sm", className = "" }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(item.id);

  const dimension = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      aria-label={favorited ? "Убрать из избранного" : "Добавить в избранное"}
      aria-pressed={favorited}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite({
          id: item.id,
          name: item.name,
          article: item.article,
          code: item.code,
          price: item.salePrices?.[0]?.value,
          image: imageUrl ?? undefined,
        });
      }}
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-inset ring-slate-200 transition hover:ring-amber-300 ${className}`.trim()}
    >
      <svg
        className={`${iconSize} transition ${favorited ? "text-amber-500" : "text-slate-400"}`}
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 1 1 6.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 0 1 0-6.364z"
        />
      </svg>
    </button>
  );
}
