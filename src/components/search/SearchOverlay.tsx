"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { MoyskladAssortmentItem, MoyskladProductFolder } from "@/lib/moysklad";
import { getItemThumbnailUrl } from "@/lib/moysklad-format";
import { buildFolderTree } from "@/lib/folder-tree";

const POPULAR_QUERIES = ["Шуруповерт", "Саморезы", "Крепёж", "Электроинструмент"];

const RESULTS_LIMIT = 8;

function formatPrice(value?: number) {
  if (value == null) return null;
  return (value / 100).toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });
}

type Props = {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
};

export default function SearchOverlay({ open, onClose, initialQuery = "" }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  // null = поиск ещё не выполнялся для текущего запроса, [] = выполнялся, но пусто.
  const [results, setResults] = useState<MoyskladAssortmentItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [folders, setFolders] = useState<MoyskladProductFolder[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [open, initialQuery]);

  // Раньше при каждом первом открытии поиска подгружался ВЕСЬ каталог
  // (limit=1000, с фото/атрибутами) и фильтрация шла на клиенте по подстроке -
  // это тяжёлый ответ (мегабайты JSON) на каждое открытие поиска, что и
  // делало открытие поиска (и сам каталог заодно, из-за общей очереди запросов
  // к МойСклад) заметно медленнее. Теперь ищем на сервере (тот же filter=name~,
  // что и в каталоге) с debounce и лимитом в RESULTS_LIMIT штук - и по сети, и
  // по нагрузке на МойСклад это несравнимо легче.
  useEffect(() => {
    const trimmed = query.trim();
    if (!open || !trimmed) {
      setResults(null);
      setSearching(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/moysklad/assortment?limit=${RESULTS_LIMIT}&search=${encodeURIComponent(trimmed)}`)
        .then((res) => (res.ok ? res.json() : { rows: [] }))
        .then((data) => {
          if (requestIdRef.current !== requestId) return; // устаревший ответ - запрос уже перезапущен новым текстом
          setResults(data.rows ?? []);
          setSearching(false);
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return;
          setResults([]);
          setSearching(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [open, query]);

  useEffect(() => {
    if (!open || folders.length) return;
    fetch("/api/moysklad/folders")
      .then((res) => (res.ok ? res.json() : { rows: [] }))
      .then((data) => setFolders(data.rows ?? []))
      .catch(() => setFolders([]));
  }, [open, folders.length]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const rootFolders = useMemo(() => buildFolderTree(folders).roots, [folders]);

  const goToFullResults = () => {
    const value = query.trim();
    onClose();
    router.push(value ? `/catalog?q=${encodeURIComponent(value)}` : "/catalog");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    goToFullResults();
  };

  if (!open) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-center overflow-y-auto bg-slate-900/60 px-3 py-6 backdrop-blur-sm sm:pt-16"
      onClick={onClose}
    >
      <div
        className="h-fit w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-b border-slate-100 p-3 sm:p-4">
          <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по каталогу"
            className="flex-1 text-base text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-amber-600 sm:px-4 sm:text-sm"
          >
            Найти
          </button>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 transition hover:text-slate-700 sm:px-3 sm:text-sm"
          >
            Закрыть
          </button>
        </form>

        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
          {hasQuery ? (
            <>
              {searching || results === null ? (
                <p className="py-10 text-center text-sm text-slate-400">Загрузка...</p>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {results.map((item) => {
                    const thumb = getItemThumbnailUrl(item);
                    const price = formatPrice(item.salePrices?.[0]?.value);
                    return (
                      <Link
                        key={item.id}
                        href={`/catalog/${item.id}`}
                        onClick={onClose}
                        prefetch={false}
                        className="group rounded-xl border border-slate-100 p-2.5 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md sm:p-3"
                      >
                        <div className="flex h-16 items-center justify-center sm:h-20">
                          {thumb ? (
                            <Image src={thumb} alt={item.name} width={80} height={80} className="max-h-16 w-auto max-w-full object-contain sm:max-h-20" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-50 text-slate-300">
                              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V6a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 6v10.5M3 16.5l5.5-5.5a1.5 1.5 0 0 1 2.12 0l1.88 1.88a1.5 1.5 0 0 0 2.12 0L18 9.5l3 3M3 16.5v1.5A1.5 1.5 0 0 0 4.5 19.5h15A1.5 1.5 0 0 0 21 18v-1.5" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-700 group-hover:text-amber-700">{item.name}</p>
                        {price && <p className="mt-1 text-sm font-semibold text-slate-900">{price}</p>}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-slate-400">Ничего не найдено по запросу «{query}»</p>
              )}

              <button
                type="button"
                onClick={goToFullResults}
                className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                Показать все результаты в каталоге →
              </button>
            </>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Часто ищут</p>
                <div className="flex flex-col gap-1">
                  {POPULAR_QUERIES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-600 transition hover:bg-amber-50 hover:text-amber-700"
                    >
                      <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                      </svg>
                      {term}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Искать по категориям</p>
                <div className="flex flex-col gap-1">
                  {rootFolders.length > 0 ? (
                    rootFolders.map((folder) => (
                      <Link
                        key={folder.id}
                        href={`/catalog?folder=${folder.id}`}
                        onClick={onClose}
                        prefetch={false}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-amber-50 hover:text-amber-700"
                      >
                        <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                        </svg>
                        {folder.name}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Загрузка категорий...</p>
                  )}
                  <Link
                    href="/catalog"
                    onClick={onClose}
                    prefetch={false}
                    className="mt-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
                  >
                    Весь каталог →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
