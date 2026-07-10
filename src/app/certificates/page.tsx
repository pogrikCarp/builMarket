import Image from "next/image";
import Link from "next/link";

const CERTIFICATES = [
  { id: 1, title: "Сертификат соответствия", image: "/sertificat/sert1.png" },
  { id: 2, title: "Лицензия на поставку", image: "/sertificat/sert2.png" },
  { id: 3, title: "Партнёрский статус", image: "/sertificat/sert3.png" },
  { id: 4, title: "Сертификат качества", image: "/sertificat/sert4.png" },
  { id: 5, title: "Экологическая безопасность", image: "/sertificat/sert5.png" },
  { id: 6, title: "Технический допуск", image: "/sertificat/sert6.png" },
];

const FOOTER_COLUMNS = [
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
];

export default function CertificatesPage() {
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
            Сертификаты, лицензии и допуски ДомСтрой
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Мы работаем с документами, которые подтверждают происхождение, безопасность и качество поставляемых материалов. Здесь
            собраны ключевые сертификаты, подтверждающие надежность ДомСтрой как поставщика строительной продукции.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-600">все сертификаты</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Документы для работы и государственных проектов</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CERTIFICATES.map((certificate) => (
              <div key={certificate.id} className="rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm">
                <div className="relative h-64 overflow-hidden rounded-2xl bg-slate-50">
                  <Image src={certificate.image} alt={certificate.title} fill className="object-contain p-6" />
                </div>
                <p className="mt-4 text-center text-sm font-semibold text-slate-800">{certificate.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      </main>

      <footer className="bg-[#f0ebe3] py-12 text-slate-900">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {FOOTER_COLUMNS.map((column) => (
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
