export default function AdminCatalogPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Управление каталогом</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        Каталог полностью синхронизируется из МойСклад — товары, категории, цены и
        остатки обновляются автоматически (см. API МойСклад). Ручное редактирование
        товаров и категорий может быть добавлено позже по требованию, но не
        рекомендуется к использованию.
      </p>
    </div>
  );
}
