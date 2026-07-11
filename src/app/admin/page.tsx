import Link from "next/link";

const SECTIONS = [
  { label: "Каталог", href: "/admin/catalog", description: "Синхронизация с МойСклад" },
  { label: "Заказы", href: "/admin/orders", description: "Просмотр, статусы, экспорт" },
  { label: "Пользователи", href: "/admin/users", description: "Клиенты и роли" },
  { label: "Баннеры и акции", href: "/admin/banners", description: "Промо-блоки на сайте" },
  { label: "Страницы", href: "/admin/pages", description: "Статичные страницы" },
  { label: "SEO / Редиректы", href: "/admin/seo", description: "301/302 переадресации" },
];

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Панель администратора</h1>
      <p className="mt-2 text-sm text-slate-500">Выберите раздел для управления сайтом.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
          >
            <p className="font-semibold text-slate-900">{s.label}</p>
            <p className="mt-1 text-sm text-slate-500">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
