"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { CATALOG_RETURN_KEY, readCatalogReturn, writeCatalogReturn } from "@/lib/catalog-return";

const subscribe = () => () => {};
const snapshot = () => { try { return sessionStorage.getItem(CATALOG_RETURN_KEY); } catch { return null; } };

export default function CatalogBackLink({ productId, fallback }: { productId: string; fallback: string }) {
  const stored = useSyncExternalStore(subscribe, snapshot, () => null);
  const saved = stored ? readCatalogReturn() : null;
  const matching = saved?.productId === productId && saved.pending ? saved : null;
  return <Link href={matching?.url ?? fallback} prefetch={false} scroll={false}
    onNavigate={() => { if (matching) writeCatalogReturn({ ...matching, pending: true }); }}
    className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:border-amber-400 hover:text-amber-700">
    <span aria-hidden="true">←</span>Назад к списку товаров
  </Link>;
}
