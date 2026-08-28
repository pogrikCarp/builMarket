import type { MetadataRoute } from "next";
import { getAssortmentIdsForSitemap, getProductFolders } from "@/lib/moysklad";
import { LOOKBOOKS } from "@/lib/lookbooks";
import { BRANDS } from "@/lib/brands";
import { SITE_URL } from "@/lib/seo";

// Карта сайта - отдельный роут со своим кэшем; обновляется раз в час, поэтому
// повторные запросы к МойСклад (для категорий и id товаров) не бьют по лимиту API.
export const revalidate = 3600;

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
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  entries.push(
    ...LOOKBOOKS.map((lookbook) => ({
      url: `${SITE_URL}/lookbooks/${lookbook.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.5,
    }))
  );

  entries.push(
    ...BRANDS.map((brand) => ({
      url: `${SITE_URL}/brands/${brand.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.5,
    }))
  );

  // МойСклад может быть временно недоступен - в этом случае отдаём карту сайта
  // хотя бы со статическими страницами, не роняя всю генерацию sitemap.xml.
  try {
    const folders = await getProductFolders();
    entries.push(
      ...folders.rows.map((folder) => ({
        url: `${SITE_URL}/catalog?folder=${folder.id}`,
        lastModified: now,
        changeFrequency: "daily" as ChangeFrequency,
        priority: 0.7,
      }))
    );
  } catch {
    // намеренно игнорируем - см. комментарий выше
  }

  try {
    const ids = await getAssortmentIdsForSitemap();
    entries.push(
      ...ids.map((id) => ({
        url: `${SITE_URL}/catalog/${id}`,
        lastModified: now,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.6,
      }))
    );
  } catch {
    // намеренно игнорируем - см. комментарий выше
  }

  return entries;
}
