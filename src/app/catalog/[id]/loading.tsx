// См. комментарий в src/app/catalog/loading.tsx - тот же приём для карточки товара.
export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="sticky top-0 z-[80] h-16 border-b border-slate-100 bg-white shadow-lg shadow-slate-900/5" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
          <p className="text-sm font-medium text-slate-500">Загружаем товар...</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-100" />
          <div className="space-y-3">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-7 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-7 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-11 w-40 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      </main>
    </div>
  );
}
