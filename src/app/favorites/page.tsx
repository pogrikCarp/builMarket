import type { Metadata } from "next";
import FavoritesClient from "./FavoritesClient";
import { buildMetadata } from "@/lib/seo";

// Избранное персонально и хранится в localStorage - индексировать не нужно.
export const metadata: Metadata = buildMetadata({
  title: "Избранное",
  description: "Товары, добавленные в избранное на сайте ДомСтрой.",
  path: "/favorites",
  noindex: true,
});

export default function FavoritesPage() {
  return <FavoritesClient />;
}
