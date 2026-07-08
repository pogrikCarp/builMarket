import Link from "next/link";
import { getAssortment } from "@/lib/moysklad";

function formatPrice(value?: number) {
  if (value == null) return null;
  return (value / 100).toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });
}

export default async function CatalogPage() {
  let items: Awaited<ReturnType<typeof getAssortment>>["rows"] = [];
  let error: string | null = null;

  try {
    const data = await getAssortment(100, 0);
    items = data.rows;
  } catch (err) {
    error = err instanceof Error ? err.message : "Ошибка загрузки каталога";
  }

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
        <h1 className="text-2xl font-semibold text-slate-900">Каталог товаров</h1>
        <p className="mt-2 text-sm text-slate-500">Выгрузка из МойСклад</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const price = item.salePrices?.[0]?.value;
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 transition hover:border-amber-300 hover:shadow-md"
              >
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  {item.article && (
                    <p className="mt-1 text-xs text-slate-400">Артикул: {item.article}</p>
                  )}
                  {item.code && (
                    <p className="text-xs text-slate-400">Код: {item.code}</p>
                  )}
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    {formatPrice(price) ? (
                      <p className="text-lg font-bold text-amber-600">{formatPrice(price)}</p>
                    ) : (
                      <p className="text-sm text-slate-400">Цена по запросу</p>
                    )}
                    {item.quantity != null && (
                      <p className="text-xs text-slate-500">В наличии: {item.quantity}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
