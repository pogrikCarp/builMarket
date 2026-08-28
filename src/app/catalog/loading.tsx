// Next.js показывает этот экран мгновенно в момент перехода на /catalog, пока
// серверный компонент (page.tsx) ждёт данные МойСклад - это чисто визуальный
// индикатор без единого дополнительного запроса, поэтому безопасно с точки
// зрения лимитов МойСклад. Без него клик по "Каталог" выглядел так, будто
// ничего не происходит (особенно если запросы МойСклад ждут своей очереди в
// общем лимитере - см. src/lib/moysklad-limiter.ts), и пользователи кликали
// повторно, думая, что кнопка не работает.
export default function CatalogLoading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="sticky top-0 z-[80] h-16 border-b border-slate-100 bg-white shadow-lg shadow-slate-900/5" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
          <p className="text-sm font-medium text-slate-500">Загружаем каталог...</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
              <div className="aspect-[4/3] rounded-lg bg-slate-100" />
              <div className="mt-4 h-3 w-3/4 rounded bg-slate-100" />
              <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
