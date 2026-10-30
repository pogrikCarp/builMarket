import type { Metadata } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import { getCatalogFolders, getCatalogList } from "@/lib/catalog-db";
import CatalogBrowser from "@/components/CatalogBrowser";
import JsonLd from "@/components/JsonLd";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getFolderPath } from "@/lib/folder-tree";
import { getResolvedPromoItems } from "@/lib/promo";
import styles from "@/components/catalog/Catalog.module.css";

type CatalogSearchParams = {
  folder?: string;
  section?: string;
  q?: string;
  sort?: string;
  stock?: string;
  priceFrom?: string;
  priceTo?: string;
  page?: string;
  view?: string;
  attributes?: string;
};

function getPageNumber(value?: string): number {
  const page = Number(value ?? "1");
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

// У каждой страницы списка свой canonical: иначе поисковик считает страницы
// 2, 3... дублями первой. Поиск и варианты фильтрации не индексируем.
export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  const params = (await searchParams) ?? {};
  const search = params.q?.trim();
  const page = getPageNumber(params.page);
  const pageSuffix = page > 1 ? ` — страница ${page}` : "";
  const canonicalParams = new URLSearchParams();
  if (params.folder) canonicalParams.set("folder", params.folder);
  else if (params.section === "promo") canonicalParams.set("section", "promo");
  if (page > 1) canonicalParams.set("page", String(page));
  const canonicalPath = `/catalog${canonicalParams.size ? `?${canonicalParams}` : ""}`;
  const noindex = Boolean(
    (params.sort && params.sort !== "popular") || params.stock || params.priceFrom || params.priceTo || params.attributes
  );

  if (search) {
    return buildMetadata({
      title: `Поиск: ${search}`,
      description: `Результаты поиска «${search}» в каталоге строительных материалов и электроинструментов ДомСтрой.`,
      path: "/catalog",
      noindex: true,
    });
  }

  if (params.folder) {
    try {
      const folders = await getCatalogFolders();
      const folder = folders.rows.find((item) => item.id === params.folder);
      if (folder) {
        return buildMetadata({
          title: `${folder.name}${pageSuffix}`,
          description: `${folder.name} — купить в ДомСтрой с доставкой по Москве и Московской области. Актуальные цены и наличие.`,
          path: canonicalPath,
          noindex,
        });
      }
    } catch {
      // МойСклад недоступен - отдаём метаданные каталога по умолчанию ниже
    }
  }

  return buildMetadata({
    title: `${params.section === "promo" ? "Акции" : "Каталог товаров"}${pageSuffix}`,
    description: "Каталог строительных и отделочных материалов, электроинструментов и наборов ДомСтрой с фильтрами по цене, наличию и категориям.",
    path: canonicalPath,
    noindex,
  });
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;
  const initialSearch = params?.q?.trim() || undefined;
  // Поисковый запрос должен искать по всему каталогу, а не только внутри выбранной папки
  const initialFolderId = initialSearch ? undefined : params?.folder;
  const initialSection = initialSearch ? "all" : params?.section === "promo" ? "promo" : "all";
  const initialPage = getPageNumber(params?.page);

  const foldersResult = await getCatalogFolders();
  const selectedFolder = initialFolderId
    ? foldersResult.rows.find((folder) => folder.id === initialFolderId) ?? null
    : null;

  // Товары и категории читаются из локального зеркала каталога (см.
  // src/lib/catalog-db.ts), поэтому страница открывается со скоростью запроса к
  // своей же БД и не ждёт ответа МойСклад. Карточки сразу приходят в
  // "облегчённом" виде (CatalogListItem) - без description, полных объектов
  // изображений и служебных полей атрибутов, которые списку не нужны и раньше
  // раздували HTML/RSC-пейлоад страницы примерно до 1.9МБ на ~170 товаров.
  const itemsPromise = getCatalogList({ folderHref: selectedFolder?.meta.href, limit: 1000 });

  const [itemsResult, promoResult] = await Promise.allSettled([itemsPromise, getResolvedPromoItems()]);

  const folders = foldersResult.rows;
  const initialItems = itemsResult.status === "fulfilled" ? itemsResult.value.rows : [];
  const error = itemsResult.status === "rejected" ? "Ошибка загрузки каталога" : null;
  const initialPromoItems = promoResult.status === "fulfilled" ? promoResult.value : [];

  const folderPath = selectedFolder ? getFolderPath(selectedFolder, folders) : [];
  const pageHeading = initialSearch ? `Поиск: ${initialSearch}` : selectedFolder?.name ?? "Каталог товаров";
  const breadcrumbItems = [
    { name: "Главная", path: "/" },
    { name: "Каталог", path: "/catalog" },
    ...folderPath.map((folder) => ({ name: folder.name, path: `/catalog?folder=${folder.id}` })),
  ];

  return (
    <div className={`min-h-screen bg-stone-50 text-slate-900 ${styles.shell}`}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <SiteHeader />

      <main className={`mx-auto max-w-7xl px-4 py-8 ${styles.page}`}>
        <div className={`mb-6 ${styles.desktopHeading}`}>
          <h1 className="text-2xl font-semibold text-slate-900">{pageHeading}</h1>
          <p className="mt-1 text-sm text-slate-500">Наведите на группу — товары появятся справа</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className={`overflow-hidden rounded-2xl border border-slate-200 shadow-sm ${styles.frame}`}>
          <CatalogBrowser
            folders={folders}
            initialItems={initialItems}
            initialFolderId={initialFolderId}
            initialSection={initialSection}
            initialSearch={initialSearch}
            initialSort={params?.sort}
            initialOnlyInStock={params?.stock === "1"}
            initialPriceFrom={params?.priceFrom}
            initialPriceTo={params?.priceTo}
            initialPage={initialPage}
            initialView={params?.view === "products" || params?.view === "categories" ? params.view : undefined}
            initialAttributes={params?.attributes}
            initialPromoItems={initialPromoItems}
          />
        </div>
      </main>
    </div>
  );
}
