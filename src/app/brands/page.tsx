import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BRANDS = [
  { name: "Fengbao", logo: "/comp/1fengbao.webp" },
  { name: "Edon", logo: "/comp/edon.jpg" },
  { name: "Redbo", logo: "/comp/redbo.jpg" },
  { name: "Makita", logo: "/comp/comp1.jpg" },
  { name: "Ресанта", logo: "/comp/comp2.jpg" },
  { name: "Бренд 6", logo: "/comp/comp3.png" },
  { name: "Бренд 7", logo: "/comp/comp4.jpg" },
  { name: "Бренд 8", logo: "/comp/comp5.png" },
  { name: "Бренд 9", logo: "/comp/comp6.jpg" },
  { name: "Бренд 10", logo: "/comp/comp7.jpg" },
  { name: "Бренд 11", logo: "/comp/comp8.jpg" },
  { name: "Бренд 12", logo: "/comp/comp9.webp" },
  { name: "Бренд 13", logo: "/comp/comp10.jpg" },
];

const BRAND_NOTES = [
  "Работаем напрямую с производителя и официальными дилерами",
  "Формируем складские запасы по ключевым позициям",
  "Поддерживаем расширенные прайс-листы и обучаем менеджеров",
];

export default async function BrandsPage() {
  const media = await prisma.banner.findMany({
    where: { type: "BRAND", active: true },
    orderBy: { sortOrder: "asc" },
  });
  const brands = [
    ...BRANDS.map((brand, index) => ({
      ...brand,
      logo: media.find((item) => item.sortOrder === index)?.image || brand.logo,
    })),
    ...media
      .filter((item) => item.sortOrder >= BRANDS.length && item.image)
      .map((item) => ({ name: item.title, logo: item.image as string })),
  ];

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
            {brands.map((brand) => (
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
                href="tel:+79160045522"
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

      <SiteFooter />
    </div>
  );
}
