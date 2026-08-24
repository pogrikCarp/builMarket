import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import CartButton from "@/components/cart/CartButton";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { getAssortment, getAssortmentByFolder, getProductFolders } from "@/lib/moysklad";
import CatalogBrowser from "@/components/CatalogBrowser";
import JsonLd from "@/components/JsonLd";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getFolderPath } from "@/lib/folder-tree";

type CatalogSearchParams = {
  folder?: string;
  section?: string;
  q?: string;
  sort?: string;
  stock?: string;
  priceFrom?: string;
  priceTo?: string;
};

// Каталог с фильтрами (?q=, ?sort=, ?stock=, ?priceFrom=, ?priceTo=) - это по сути один
// и тот же список товаров в разных представлениях, поэтому canonical всегда указывает
// на "чистый" адрес раздела (только /catalog или /catalog?folder=ID) без служебных
// параметров - это предотвращает индексацию дублей одной и той же выдачи.
export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  const params = (await searchParams) ?? {};
  const search = params.q?.trim();

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
      const folders = await getProductFolders();
      const folder = folders.rows.find((item) => item.id === params.folder);
      if (folder) {
        return buildMetadata({
          title: folder.name,
          description: `${folder.name} — купить в ДомСтрой с доставкой по Москве и Московской области. Актуальные цены и наличие.`,
          path: `/catalog?folder=${folder.id}`,
        });
      }
    } catch {
      // МойСклад недоступен - отдаём метаданные каталога по умолчанию ниже
    }
  }

  return buildMetadata({
    title: "Каталог товаров",
    description: "Каталог строительных и отделочных материалов, электроинструментов и наборов ДомСтрой с фильтрами по цене, наличию и категориям.",
    path: "/catalog",
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

  const foldersResult = await getProductFolders();
  const selectedFolder = initialFolderId
    ? foldersResult.rows.find((folder) => folder.id === initialFolderId) ?? null
    : null;

  const itemsPromise = selectedFolder
    ? getAssortmentByFolder(selectedFolder.meta.href, 1000, 0)
    : getAssortment(1000, 0);

  const itemsResult = await Promise.allSettled([itemsPromise]);

  const folders = foldersResult.rows;
  const initialItems = itemsResult[0].status === "fulfilled" ? itemsResult[0].value.rows : [];
  const error = itemsResult[0].status === "rejected" ? "Ошибка загрузки данных из МойСклад" : null;

  const folderPath = selectedFolder ? getFolderPath(selectedFolder, folders) : [];
  const pageHeading = initialSearch ? `Поиск: ${initialSearch}` : selectedFolder?.name ?? "Каталог товаров";
  const breadcrumbItems = [
    { name: "Главная", path: "/" },
    { name: "Каталог", path: "/catalog" },
    ...folderPath.map((folder) => ({ name: folder.name, path: `/catalog?folder=${folder.id}` })),
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex shrink-0 items-center">
            <Image src="/logo.png" alt="ДомСтрой" width={110} height={52} className="h-10 w-auto object-contain sm:h-12" />
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-slate-600 hover:text-slate-900">Главная</Link>
            <Link href="/catalog" prefetch={false} className="font-semibold text-amber-600">Каталог</Link>
            <Link href="/personal" className="text-slate-600 hover:text-slate-900">Кабинет</Link>
            <FavoriteButton variant="inline" />
            <CartButton variant="inline" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">{pageHeading}</h1>
          <p className="mt-1 text-sm text-slate-500">Наведите на группу — товары появятся справа</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
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
          />
        </div>
      </main>
    </div>
  );
}
