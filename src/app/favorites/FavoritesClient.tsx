"use client";

import Image from "next/image";
import Link from "next/link";
import CartButton from "@/components/cart/CartButton";
import { useCart } from "@/components/cart/CartProvider";
import { useFavorites } from "@/components/favorites/FavoriteProvider";

function formatPrice(value?: number) {
  if (value == null) return "Цена по запросу";
  return (value / 100).toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });
}

export default function FavoritesClient() {
  const { items, removeFavorite, clearFavorites } = useFavorites();
  const { addItem } = useCart();

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex shrink-0 items-center">
            <Image src="/logo.png" alt="ДомСтрой" width={110} height={52} className="h-10 w-auto object-contain sm:h-12" />
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-slate-600 hover:text-slate-900">Главная</Link>
            <Link href="/catalog" prefetch={false} className="text-slate-600 hover:text-slate-900">Каталог</Link>
            <CartButton variant="inline" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Избранное</h1>
            <p className="mt-2 text-sm text-slate-500">Товары, которые вы отметили сердечком в каталоге.</p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearFavorites}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-red-200 hover:text-red-500"
            >
              Очистить избранное
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 1 1 6.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 0 1 0-6.364z" />
            </svg>
            <p className="mt-4 text-xl font-semibold text-slate-900">В избранном пока пусто</p>
            <p className="mt-2 text-sm text-slate-500">Нажмите на сердечко у товара в каталоге, чтобы добавить его сюда.</p>
            <Link
              href="/catalog"
              prefetch={false}
              className="mt-6 inline-flex rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <div className="mb-4 overflow-hidden rounded-lg bg-white">
                    <div className="relative aspect-[4/3] w-full">
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill className="object-contain p-2" unoptimized />
                      )}
                    </div>
                  </div>
                  <Link href={`/catalog/${item.id}`} prefetch={false} className="font-semibold leading-snug text-slate-900 hover:text-amber-600">
                    {item.name}
                  </Link>
                  {item.article && <p className="mt-1 text-xs text-slate-400">Арт: {item.article}</p>}
                  {item.code && <p className="text-xs text-slate-400">Код: {item.code}</p>}
                </div>
                <div className="mt-4 flex items-end justify-between gap-2">
                  <p className="text-base font-bold text-amber-600">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addItem({ id: item.id, name: item.name, article: item.article, code: item.code, price: item.price })}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
                    >
                      В корзину
                    </button>
                    <button
                      type="button"
                      aria-label="Убрать из избранного"
                      onClick={() => removeFavorite(item.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
