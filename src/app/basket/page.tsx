import type { Metadata } from "next";
import BasketClient from "./BasketClient";
import { buildMetadata } from "@/lib/seo";

// Содержимое корзины персонально и хранится в localStorage - индексировать
// эту страницу поисковикам смысла нет (пустая или чужая корзина в выдаче).
export const metadata: Metadata = buildMetadata({
  title: "Корзина",
  description: "Товары, добавленные в корзину покупок ДомСтрой.",
  path: "/basket",
  noindex: true,
});

export default function BasketPage() {
  return <BasketClient />;
}
