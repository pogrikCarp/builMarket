import Image from "next/image";
import Link from "next/link";

const BRANDS = [
  { name: "Бренд 1", logo: "/comp/comp1.jpg" },
  { name: "Бренд 2", logo: "/comp/comp2.jpg" },
  { name: "Бренд 3", logo: "/comp/comp3.png" },
  { name: "Бренд 4", logo: "/comp/comp4.jpg" },
  { name: "Бренд 5", logo: "/comp/comp5.png" },
  { name: "Бренд 6", logo: "/comp/comp6.jpg" },
  { name: "Бренд 7", logo: "/comp/comp7.jpg" },
  { name: "Бренд 8", logo: "/comp/comp8.jpg" },
  { name: "Бренд 9", logo: "/comp/comp9.webp" },
  { name: "Бренд 10", logo: "/comp/comp10.jpg" },
  { name: "Бренд 11", logo: "/comp/comp1.jpg" },
  { name: "Бренд 12", logo: "/comp/comp2.jpg" },
];

const BRAND_NOTES = [
  "Работаем напрямую с производителя и официальными дилерами",
  "Формируем складские запасы по ключевым позициям",
  "Поддерживаем расширенные прайс-листы и обучаем менеджеров",
];

export default function BrandsPage() {
  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-900">
      <main>
        <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fff7e8] via-white to-[#f7f1e6]" />
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Link href="/" className="text-xs font-semibold uppercase tracking-[0.45em] text-amber-500">
            ← ДомСтрой
          </Link>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            Бренды, с которыми ДомСтрой строит каждый день
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Мы собираем ассортимент из проверенных производителей: от федеральных заводов до нишевых фабрик. Благодаря этому в
            каталоге представлены решения для ремонта, стройки и инженерии с гарантированной поставкой и сервисом.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {BRAND_NOTES.map((note) => (
              <div key={note} className="rounded-3xl border border-amber-100 bg-white px-5 py-4 text-sm font-semibold text-slate-700">
                {note}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-600">каталог брендов</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Бренды партнёров ДомСтрой</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BRANDS.map((brand) => (
              <div key={brand.name} className="rounded-[28px] border border-slate-100 bg-white/90 p-5 shadow-sm">
                <div className="flex h-24 items-center justify-center rounded-2xl bg-[#fdf8f1]">
                  <Image src={brand.logo} alt={brand.name} width={180} height={80} className="h-16 w-auto object-contain" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl rounded-[44px] bg-gradient-to-r from-[#fff0d1] via-[#ffe3ac] to-[#ffd28b] p-[1px]">
            <div className="rounded-[42px] bg-white px-6 py-12 text-[#2d1c0d] md:px-12">
            <h2 className="text-3xl font-semibold">Хотите стать партнёром ДомСтрой?</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#4c3520]">
              Расскажите о своем бренде, продукте и логистике. Мы рассмотрим предложение, согласуем условия и добавим товары в
              каталог ДомСтрой.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="tel:88002507626"
                className="rounded-full bg-[#2d1c0d] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-amber-200 transition hover:bg-[#3a2614]"
              >
                Связаться с отделом закупок
              </a>
              <Link href="/" className="rounded-full border border-[#2d1c0d]/20 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#2d1c0d]">
                Вернуться на главную
              </Link>
            </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#f0ebe3] py-12 text-slate-900">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Контакты",
                items: [
                  { label: "Контакты", href: "https://zv.market/contacts/" },
                  { label: "Прайс-лист", href: "https://zv.market/price.xlsx" },
                  { label: "Онлайн-трансляция", href: "https://zv.market/webcams/" },
                ],
              },
              {
                title: "Услуги",
                items: [
                  { label: "Доставка", href: "https://zv.market/services/dostavka/" },
                  { label: "Погрузочные работы", href: "https://zv.market/services/pogruzochnye-raboty/" },
                  { label: "Колеровка", href: "https://zv.market/services/kolerovka/" },
                  { label: "Кредитование", href: "https://zv.market/services/kreditovanie/" },
                ],
              },
              {
                title: "Информация",
                items: [
                  { label: "Как купить", href: "https://zv.market/help/" },
                  { label: "Вопрос-ответ", href: "https://zv.market/info/faq/" },
                  { label: "Условия оплаты", href: "https://zv.market/help/payment/" },
                  { label: "Гарантия", href: "https://zv.market/help/warranty/" },
                ],
              },
              {
                title: "Документы",
                items: [
                  { label: "Реквизиты", href: "https://zv.market/info/requisites/" },
                  { label: "Политика конфиденциальности", href: "/privacy" },
                  { label: "Политика обработки персональных данных", href: "/personal-data" },
                  { label: "Лицензии", href: "https://zv.market/company/licenses/" },
                  { label: "Карьера", href: "https://zv.market/company/vakansii/" },
                ],
              },
            ].map((column) => (
              <div key={column.title}>
                <p className="text-xs uppercase tracking-[0.4em] text-amber-600/80">{column.title}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <a href={item.href} className="hover:text-amber-600" target="_blank" rel="noreferrer">
                        {item.label}
                      </a>
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
    </div>
  );
}
