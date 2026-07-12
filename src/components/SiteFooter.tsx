import Link from "next/link";

type FooterLink = { label: string; href: string };

const FOOTER_COLUMNS: { title: string; items: FooterLink[] }[] = [
  {
    title: "Контакты",
    items: [
      { label: "Контакты", href: "/contacts" },
      { label: "Прайс-лист", href: "/price-list" },
      { label: "Онлайн-трансляция", href: "/webcams" },
    ],
  },
  {
    title: "Услуги",
    items: [
      { label: "Доставка", href: "/services/dostavka" },
      { label: "Погрузочные работы", href: "/services/pogruzochnye-raboty" },
      { label: "Колеровка", href: "/services/kolerovka" },
      { label: "Кредитование", href: "/services/kreditovanie" },
    ],
  },
  {
    title: "Информация",
    items: [
      { label: "Как купить", href: "/help" },
      { label: "Вопрос-ответ", href: "/faq" },
      { label: "Условия оплаты", href: "/help/payment" },
      { label: "Гарантия", href: "/help/warranty" },
    ],
  },
  {
    title: "Документы",
    items: [
      { label: "Реквизиты", href: "/requisites" },
      { label: "Политика конфиденциальности", href: "/privacy" },
      { label: "Политика обработки персональных данных", href: "/personal-data" },
      { label: "Лицензии", href: "/licenses" },
      { label: "Карьера", href: "/vacancies" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-[#f0ebe3] py-12 text-slate-900">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-xs uppercase tracking-[0.4em] text-amber-600/80">{column.title}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {column.items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="hover:text-amber-600">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} ДомСтрой — комплексные поставки строительных материалов</div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="tel:88002507626" className="hover:text-amber-600">
              8 800 250 76 26
            </a>
            <a href="tel:84997025545" className="hover:text-amber-600">
              8 499 702 55 45
            </a>
            <a href="mailto:info@domstroy.market" className="hover:text-amber-600">
              info@domstroy.market
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
