import type { Metadata } from "next";
import MediaImage from "@/components/MediaImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import JsonLd from "@/components/JsonLd";
import ProductCartControl from "@/components/cart/ProductCartControl";
import ProductCardMedia from "@/components/catalog/ProductCardMedia";
import { getPublishedBrand, brandSummary } from "@/lib/brand-profiles";
import { getCatalogAssortment, getCatalogItemsByIds } from "@/lib/catalog-db";
import type { MoyskladAssortmentItem } from "@/lib/moysklad";
import { getItemGalleryThumbnailUrls } from "@/lib/moysklad-format";
import { absoluteUrl, buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";

function formatPrice(value?: number) {
  if (value == null) return null;
  return (value / 100).toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getPublishedBrand(slug);
  if (!brand) return buildMetadata({ title: "Бренд не найден", description: "Бренд не найден", path: `/brands/${slug}`, noindex: true });

  return buildMetadata({
    title: brand.seoTitle || `${brand.name} — купить в ДомСтрой`,
    description: brand.seoDescription || [brand.tagline, brand.description[0]].filter(Boolean).join(". ").slice(0, 300) || `${brand.name} в магазине ДомСтрой. Товары, цены и наличие, доставка по Москве и Московской области.`,
    path: `/brands/${brand.slug}`,
    image: brand.logo,
  });
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getPublishedBrand(slug);
  if (!brand) notFound();

  // Популярные товары подбираем поиском по локальному зеркалу каталога
  // (src/lib/catalog-db.ts) - ищет и по названию, и по артикулу, и по
  // характеристикам, без обращения к МойСклад на каждый заход робота или
  // посетителя. Если зеркало пустое, страница всё равно отдаёт описание бренда
  // без товарного блока - это не должно ронять SEO-страницу.
  let popularProducts: MoyskladAssortmentItem[] = [];
  if (brand.inCatalog) {
    try {
      if (brand.productIds.length) {
        const selected = await getCatalogItemsByIds(brand.productIds);
        popularProducts = brand.productIds.flatMap(id => selected.get(id) ? [selected.get(id)!] : []);
      } else if (brand.searchTerm) {
        const result = await getCatalogAssortment({ search: brand.searchTerm, limit: 8 });
        popularProducts = result.rows;
      }
    } catch {
      popularProducts = [];
    }
  }

  const catalogHref = brand.searchTerm ? `/catalog?q=${encodeURIComponent(brand.searchTerm)}` : "/catalog";

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Главная", path: "/" },
          { name: "Бренды", path: "/brands" },
          { name: brand.name, path: `/brands/${brand.slug}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Brand",
          name: brand.name,
          description: brand.description.join(" "),
          logo: absoluteUrl(brand.logo),
          url: absoluteUrl(`/brands/${brand.slug}`),
        }}
      />
      <SiteHeader />

      <main className="mx-auto min-w-0 [overflow-wrap:anywhere] max-w-6xl px-4 py-8 sm:px-6">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          <Link href="/brands" prefetch={false} className="hover:text-amber-600">Бренды</Link>
          <span>/</span>
          <span className="text-slate-700">{brand.name}</span>
        </nav>

        <section className="grid gap-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10 md:grid-cols-[220px_1fr] md:items-center">
          <div className="flex h-32 items-center justify-center rounded-2xl bg-[#fdf8f1] md:h-40">
            <MediaImage src={brand.logo} fallbackSrc={brandSummary(brand).fallbackSrc} alt={brand.name} width={220} height={120} className="h-20 w-auto object-contain md:h-28" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">бренд</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{brand.name}</h1>
            <p className="mt-3 text-lg text-slate-600">{brand.tagline}</p>
              <Link
                href={catalogHref}
                prefetch={false}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-amber-600"
              >
                Смотреть товары {brand.name} в каталоге
                <span aria-hidden>→</span>
              </Link>
          </div>
        </section>

        {(brand.description.length > 0 || brand.categories.length > 0 || brand.advantages.length > 0) && <section className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          {brand.description.length > 0 && <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">О бренде</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">
              {brand.description.map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line [overflow-wrap:anywhere]">{paragraph}</p>
              ))}
            </div>
          </div>}

          <div className="space-y-6">
            {brand.categories.length > 0 && <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Категории товаров</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {brand.categories.map((category) => (
                  <li key={category} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {category}
                  </li>
                ))}
              </ul>
            </div>}

            {brand.advantages.length > 0 && <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Преимущества</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {brand.advantages.map((advantage) => (
                  <li key={advantage} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {advantage}
                  </li>
                ))}
              </ul>
            </div>}
          </div>
        </section>}

        {brand.inCatalog && popularProducts.length > 0 && (
          <section className="mt-10">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Популярные товары {brand.name}</h2>
              <Link href={catalogHref} prefetch={false} className="text-sm font-semibold text-amber-600 hover:text-amber-700">
                Весь каталог {brand.name} →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {popularProducts.map((item) => {
                const price = item.salePrices?.[0]?.value;
                const galleryUrls = getItemGalleryThumbnailUrls(item);
                return (
                  <Link
                    key={item.id}
                    href={`/catalog/${item.id}`}
                    prefetch={false}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-white">
                      <ProductCardMedia images={galleryUrls} alt={item.name} />
                    </div>
                    <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-slate-800">{item.name}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-amber-600">{formatPrice(price) ?? "по запросу"}</span>
                      <ProductCartControl item={item} size="sm" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {brand.inCatalog && popularProducts.length === 0 && (
          <p className="mt-10 text-sm text-slate-500">
            Товары {brand.name} временно недоступны для показа — уточните наличие конкретных моделей у менеджера ДомСтрой.
          </p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
