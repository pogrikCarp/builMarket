"use client";

import Image from "next/image";
import Link from "next/link";
import CartButton from "@/components/cart/CartButton";
import { useCart } from "@/components/cart/CartProvider";
import FavoriteButton from "@/components/favorites/FavoriteButton";

function formatPrice(value?: number) {
  if (value == null) return "Цена по запросу";
  return (value / 100).toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });
}

export default function BasketClient() {
  const { items, total, setQuantity, removeItem, clearCart } = useCart();

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
            <FavoriteButton variant="inline" />
            <CartButton variant="inline" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">Корзина</h1>
          <p className="mt-2 text-sm text-slate-500">Проверьте состав заказа и измените количество товаров при необходимости.</p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-xl font-semibold text-slate-900">Корзина пока пуста</p>
            <p className="mt-2 text-sm text-slate-500">Добавьте товары из каталога, и они появятся здесь.</p>
            <Link
              href="/catalog"
              prefetch={false}
              className="mt-6 inline-flex rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {items.map((item) => {
                const lineTotal = (item.price ?? 0) * item.quantity;
                return (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                          {item.article && <span>Арт: {item.article}</span>}
                          {item.code && <span>Код: {item.code}</span>}
                        </div>
                        <p className="mt-3 text-sm text-slate-500">Цена: {formatPrice(item.price)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-2 text-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                          >
                            −
                          </button>
                          <span className="min-w-12 px-3 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-2 text-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                          >
                            +
                          </button>
                        </div>
                        <div className="min-w-28 text-right">
                          <p className="text-sm text-slate-400">Сумма</p>
                          <p className="text-lg font-bold text-slate-900">{formatPrice(lineTotal)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-red-200 hover:text-red-500"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Ваш заказ</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Позиций</span>
                  <span className="font-semibold text-slate-900">{items.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Товаров</span>
                  <span className="font-semibold text-slate-900">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-base font-semibold text-slate-900">Итого</span>
                  <span className="text-xl font-bold text-slate-900">{formatPrice(total)}</span>
                </div>
              </div>
              <Link
                href="/order"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500"
              >
                Оформить заказ
              </Link>
              <button
                type="button"
                onClick={clearCart}
                className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Очистить корзину
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
