import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { getPublishedBrands, brandSummary } from "@/lib/brand-profiles";
import { buildMetadata } from "@/lib/seo";

// Интерактивная вёрстка находится в HomeClient. Опубликованные бренды приходят
// с сервера, поэтому новые ссылки видны и покупателю, и поисковому роботу сразу.
export const metadata: Metadata = buildMetadata({
  titleAbsolute: "ДомСтрой — строительные материалы, электроинструменты и наборы для ремонта",
  description:
    "Магазин строительных и отделочных материалов в Домодедово: смеси, краски, крепёж, сантехника, электрика, электроинструменты и готовые наборы. Доставка по Москве и Московской области, самовывоз со склада.",
  path: "/",
});

export const dynamic = "force-dynamic";

export default async function Home() {
  const brands = (await getPublishedBrands()).filter(brand => brand.showOnHome).map(brandSummary);
  return <HomeClient brands={brands} />;
}
