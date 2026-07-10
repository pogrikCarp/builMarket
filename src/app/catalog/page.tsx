import Link from "next/link";
import { getAssortment, getProductFolders } from "@/lib/moysklad";
import CatalogBrowser from "@/components/CatalogBrowser";

export default async function CatalogPage() {
  const [foldersResult, itemsResult] = await Promise.allSettled([
    getProductFolders(),
    getAssortment(100, 0),
  ]);

  const folders = foldersResult.status === "fulfilled" ? foldersResult.value.rows : [];
  const initialItems = itemsResult.status === "fulfilled" ? itemsResult.value.rows : [];
  const error =
    foldersResult.status === "rejected" || itemsResult.status === "rejected"
      ? "Ошибка загрузки данных из МойСклад"
      : null;

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-slate-900">ДомСтрой</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-slate-600 hover:text-slate-900">Главная</Link>
            <Link href="/catalog" className="font-semibold text-amber-600">Каталог</Link>
            <Link href="/personal" className="text-slate-600 hover:text-slate-900">Кабинет</Link>
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
          <CatalogBrowser folders={folders} initialItems={initialItems} />
        </div>
      </main>
    </div>
  );
}
