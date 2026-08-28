"use client";

import { useEffect, useRef, useState } from "react";

type PromoItem = {
  id: string;
  productId: string;
  oldPrice: number | null;
  sortOrder: number;
  active: boolean;
  productName: string | null;
  productPrice: number | null;
  productMissing: boolean;
};

type SearchResult = {
  id: string;
  name: string;
  article?: string;
  salePrices?: { value: number }[];
  images?: { rows?: { miniature?: { href: string }; tiny?: { href: string }; meta: { href: string; downloadHref?: string } }[] };
};

function formatRub(kopecks: number | null) {
  if (kopecks == null) return "—";
  return (kopecks / 100).toLocaleString("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
}

function thumbnailUrl(result: SearchResult): string | null {
  const image = result.images?.rows?.[0];
  if (!image) return null;
  const href = image.miniature?.href ?? image.tiny?.href ?? image.meta.downloadHref ?? image.meta.href;
  return `/api/moysklad/image?href=${encodeURIComponent(href)}`;
}

export function PromoManager() {
  const [items, setItems] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadItems = () => {
    setLoading(true);
    fetch("/api/admin/promo")
      .then(async (res) => {
        if (!res.ok) throw new Error("Ошибка загрузки списка акций");
        return res.json();
      })
      .then((data) => setItems(data.items ?? []))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/moysklad/assortment?search=${encodeURIComponent(trimmed)}&limit=15`);
        const data = await res.json();
        setResults(res.ok ? data.rows ?? [] : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const addProduct = async (productId: string) => {
    setAdding(productId);
    setError(null);
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка добавления");
      setQuery("");
      setResults([]);
      loadItems();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ошибка добавления");
    } finally {
      setAdding(null);
    }
  };

  const updateItem = async (id: string, patch: Partial<Pick<PromoItem, "oldPrice" | "active" | "sortOrder">>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    try {
      const res = await fetch(`/api/admin/promo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Ошибка сохранения");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ошибка сохранения");
      loadItems();
    }
  };

  const removeItem = async (item: PromoItem) => {
    if (!confirm(`Убрать «${item.productName ?? item.productId}» из акций?`)) return;
    const res = await fetch(`/api/admin/promo/${item.id}`, { method: "DELETE" });
    if (res.ok) setItems((current) => current.filter((entry) => entry.id !== item.id));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Акции</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Найдите товар из каталога МойСклад и добавьте его в блок «Акции» на главной и в
          каталоге. Актуальная цена, фото и наличие всегда берутся из МойСклад — здесь нужно
          только указать предыдущую (зачёркнутую) цену для скидки.
        </p>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="relative mt-5">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Начните вводить название товара..."
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
          />
          {(searching || results.length > 0) && query.trim().length >= 2 && (
            <div className="absolute z-10 mt-1 w-full max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {searching && <p className="px-4 py-3 text-sm text-slate-400">Поиск...</p>}
              {!searching && results.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-400">Ничего не найдено</p>
              )}
              {!searching &&
                results.map((result) => {
                  const alreadyAdded = items.some((item) => item.productId === result.id);
                  const thumb = thumbnailUrl(result);
                  return (
                    <div key={result.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-50">
                        {thumb && <img src={thumb} alt={result.name} className="h-full w-full object-contain" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{result.name}</p>
                        <p className="text-xs text-slate-400">{formatRub(result.salePrices?.[0]?.value ?? null)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={alreadyAdded || adding === result.id}
                        onClick={() => addProduct(result.id)}
                        className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        {alreadyAdded ? "Добавлено" : adding === result.id ? "..." : "+ Добавить"}
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Товары в акции ({items.length})</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Загрузка...</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Пока ни один товар не добавлен в акции</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3">Товар</th>
                  <th className="py-2 pr-3">Текущая цена</th>
                  <th className="py-2 pr-3">Старая цена, ₽</th>
                  <th className="py-2 pr-3">Порядок</th>
                  <th className="py-2 pr-3">Активна</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3 pr-3">
                      {item.productMissing ? (
                        <span className="text-red-500">Товар не найден в МойСклад</span>
                      ) : (
                        <span className="font-medium text-slate-800">{item.productName}</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-slate-600">{formatRub(item.productPrice)}</td>
                    <td className="py-3 pr-3">
                      <input
                        type="number"
                        min={0}
                        step="1"
                        defaultValue={item.oldPrice ?? ""}
                        onBlur={(event) => {
                          const value = event.target.value;
                          updateItem(item.id, { oldPrice: value === "" ? null : Number(value) });
                        }}
                        className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-amber-400"
                      />
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        type="number"
                        defaultValue={item.sortOrder}
                        onBlur={(event) => updateItem(item.id, { sortOrder: Number(event.target.value) })}
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-amber-400"
                      />
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        type="checkbox"
                        checked={item.active}
                        onChange={(event) => updateItem(item.id, { active: event.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <button type="button" onClick={() => removeItem(item)} className="text-xs font-semibold text-red-600 hover:text-red-800">
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
