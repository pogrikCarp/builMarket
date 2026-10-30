import type { MetadataRoute } from "next";
import { getCatalogFolders, getCatalogSitemapProducts } from "@/lib/catalog-db";
import { LOOKBOOKS } from "@/lib/lookbooks";
import { getPublishedBrands } from "@/lib/brand-profiles";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

// Карта сайта строится из локального зеркала каталога (src/lib/catalog-db.ts),
// поэтому новые товары сразу попадают в карту сайта без запросов к МойСклад.
// При сбое БД возвращается ошибка, а не успешная пустая карта вместо товаров.
export const dynamic = "force-dynamic";

type ChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: ChangeFrequency }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/catalog", priority: 0.9, changeFrequency: "daily" },
  { path: "/lookbooks", priority: 0.6, changeFrequency: "weekly" },
  { path: "/brands", priority: 0.5, changeFrequency: "monthly" },
  { path: "/certificates", priority: 0.4, changeFrequency: "monthly" },
  { path: "/company", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contacts", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/help", priority: 0.5, changeFrequency: "monthly" },
  { path: "/help/payment", priority: 0.4, changeFrequency: "monthly" },
  { path: "/help/warranty", priority: 0.4, changeFrequency: "monthly" },
  { path: "/services", priority: 0.5, changeFrequency: "monthly" },
  { path: "/services/dostavka", priority: 0.4, changeFrequency: "monthly" },
  { path: "/services/kolerovka", priority: 0.4, changeFrequency: "monthly" },
  { path: "/services/kreditovanie", priority: 0.4, changeFrequency: "monthly" },
  { path: "/services/pogruzochnye-raboty", priority: 0.4, changeFrequency: "monthly" },
  { path: "/price-list", priority: 0.4, changeFrequency: "monthly" },
  { path: "/vacancies", priority: 0.3, changeFrequency: "monthly" },
  { path: "/requisites", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/personal-data", priority: 0.2, changeFrequency: "yearly" },
  { path: "/licenses", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [folders, products, brands] = await Promise.all([
    getCatalogFolders(),
    getCatalogSitemapProducts(),
    getPublishedBrands(),
  ]);

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  entries.push(
    ...LOOKBOOKS.map((lookbook) => ({
      url: `${SITE_URL}/lookbooks/${lookbook.slug}`,
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.5,
    }))
  );

  entries.push(
    ...brands.map((brand) => ({
      url: `${SITE_URL}/brands/${brand.slug}`,
      lastModified: brand.updatedAt ?? undefined,
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.5,
    }))
  );

  entries.push(
    ...folders.rows.map((folder) => ({
      url: `${SITE_URL}/catalog?folder=${folder.id}`,
      changeFrequency: "daily" as ChangeFrequency,
      priority: 0.7,
    }))
  );

  entries.push(
    ...products.map((product) => ({
      url: `${SITE_URL}/catalog/${product.id}`,
      lastModified: product.lastModified,
      images: product.images.map(absoluteUrl),
      changeFrequency: "weekly" as ChangeFrequency,
      priority: 0.6,
    }))
  );

  return entries;
}
