import Link from "next/link";
import Image from "next/image";
import CartButton from "@/components/cart/CartButton";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { getAssortment, getAssortmentByFolder, getProductFolders } from "@/lib/moysklad";
import CatalogBrowser from "@/components/CatalogBrowser";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ folder?: string; section?: string }>;
}) {
  const params = await searchParams;
  const initialFolderId = params?.folder;
  const initialSection = params?.section === "promo" ? "promo" : "all";

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

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex shrink-0 items-center">
            <Image src="/logo.png" alt="ДомСтрой" width={110} height={52} className="h-10 w-auto object-contain sm:h-12" />
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-slate-600 hover:text-slate-900">Главная</Link>
            <Link href="/catalog" className="font-semibold text-amber-600">Каталог</Link>
            <Link href="/personal" className="text-slate-600 hover:text-slate-900">Кабинет</Link>
            <FavoriteButton variant="inline" />
            <CartButton variant="inline" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Каталог товаров</h1>
          <p className="mt-1 text-sm text-slate-500">Наведите на группу — товары появятся справа</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <CatalogBrowser folders={folders} initialItems={initialItems} initialFolderId={initialFolderId} initialSection={initialSection} />
        </div>
      </main>
    </div>
  );
}
