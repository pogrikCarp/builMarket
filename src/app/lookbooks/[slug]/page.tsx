import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import ProductCartControl from "@/components/cart/ProductCartControl";
import ProductFavoriteToggle from "@/components/favorites/ProductFavoriteToggle";
import { LOOKBOOKS, getLookbookBySlug, type Lookbook } from "@/lib/lookbooks";
import { getProductById, getItemGalleryUrls, type MoyskladAssortmentItem } from "@/lib/moysklad";
import { buildBreadcrumbJsonLd, buildMetadata, buildProductJsonLd } from "@/lib/seo";

// Цена и наличие набора могут поменяться в МойСклад в любой момент - раз в час
// достаточно, чтобы страница оставалась актуальной и при этом не создавала
// лишнюю нагрузку на API МойСклад (запросы всё равно проходят через общий
// лимитер и кэш - см. src/lib/moysklad-limiter.ts и src/lib/moysklad.ts).
export const revalidate = 3600;

function formatPrice(value?: number) {
  if (!value) return null;
  return (value / 100).toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });
}

async function fetchLookbookProduct(lookbook: Lookbook): Promise<MoyskladAssortmentItem | null> {
  try {
    return await getProductById(lookbook.moyskladId, lookbook.moyskladType);
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return LOOKBOOKS.map((lookbook) => ({ slug: lookbook.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const lookbook = getLookbookBySlug(slug);
  if (!lookbook) return buildMetadata({ title: "Набор не найден", description: "Набор не найден", path: `/lookbooks/${slug}`, noindex: true });

  return buildMetadata({
    title: `${lookbook.title} — готовый набор электроинструментов`,
    description: `${lookbook.title}: ${lookbook.platform}, ${lookbook.tools.length} инструмента(ов) в комплекте. ${lookbook.description}`.slice(0, 300),
    path: `/lookbooks/${lookbook.slug}`,
    image: lookbook.image,
  });
}

export default async function LookbookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lookbook = getLookbookBySlug(slug);
  if (!lookbook) notFound();

  const [product, ...comparisonProducts] = await Promise.all([
    fetchLookbookProduct(lookbook),
    ...LOOKBOOKS.filter((item) => item.slug !== lookbook.slug).map(fetchLookbookProduct),
  ]);

  const otherLookbooks = LOOKBOOKS.filter((item) => item.slug !== lookbook.slug);
  const comparisonRows = [
    { lookbook, product },
    ...otherLookbooks.map((item, index) => ({ lookbook: item, product: comparisonProducts[index] })),
  ];

  const price = product?.salePrices?.[0]?.value;
  const inStock = Boolean(product?.quantity && product.quantity > 0);
  const galleryImages = product ? getItemGalleryUrls(product) : [];
  const heroImage = galleryImages[0] ?? lookbook.image;

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-900">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Главная", path: "/" },
          { name: "Готовые наборы электроинструментов", path: "/lookbooks" },
          { name: lookbook.title, path: `/lookbooks/${lookbook.slug}` },
        ])}
      />
      <JsonLd
        data={buildProductJsonLd({
          id: lookbook.moyskladId,
          name: `${lookbook.title} (${lookbook.tools.map((tool) => tool.name).join(", ")})`,
          description: lookbook.richDescription ?? lookbook.description,
          images: galleryImages.length > 0 ? galleryImages : [lookbook.image],
          price: price != null ? price / 100 : undefined,
          inStock,
          brand: "Fengbao",
        })}
      />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fff7e8] via-white to-[#f7f1e6]" />
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
            <Link href="/lookbooks" className="text-xs font-semibold uppercase tracking-[0.45em] text-amber-500">
              ← Все наборы электроинструментов
            </Link>
            <p className="mt-8 text-sm uppercase tracking-[0.35em] text-amber-600">{lookbook.platform}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">{lookbook.title}</h1>

            <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-start">
              <div className="relative overflow-hidden rounded-3xl shadow-lg" style={{ aspectRatio: "0.75" }}>
                <Image
                  src={heroImage}
                  alt={lookbook.title}
                  fill
                  className="object-cover"
                  style={{ objectPosition: galleryImages.length > 0 ? "center" : lookbook.imagePosition ?? "center" }}
                  unoptimized={galleryImages.length > 0}
                />
              </div>
              <div>
                <p className="text-lg leading-8 text-slate-600">{lookbook.description}</p>

                <div className="mt-6 flex flex-wrap items-end gap-4">
                  {formatPrice(price) ? (
                    <span className="text-3xl font-bold text-amber-600">{formatPrice(price)}</span>
                  ) : (
                    <span className="text-lg text-slate-400">Цена по запросу — уточняйте у менеджера</span>
                  )}
                </div>

                <p className={`mt-2 text-sm font-medium ${inStock ? "text-green-600" : "text-slate-400"}`}>
                  {product ? (inStock ? `● В наличии: ${product.quantity} шт.` : "Нет в наличии — уточняйте сроки поставки") : "Наличие уточняется"}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {product ? (
                    <>
                      <ProductCartControl item={product} size="md" />
                      <ProductFavoriteToggle item={product} imageUrl={heroImage} size="md" />
                    </>
                  ) : (
                    <a
                      href="tel:+79160045522"
                      className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-amber-600"
                    >
                      Уточнить наличие по телефону
                    </a>
                  )}
                </div>

                <dl className="mt-8 space-y-3 rounded-2xl border border-amber-100 bg-white/70 p-5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Платформа</dt>
                    <dd className="text-right font-medium text-slate-900">{lookbook.platform}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Аккумуляторы</dt>
                    <dd className="text-right font-medium text-slate-900">{lookbook.batteries}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Инструментов в наборе</dt>
                    <dd className="text-right font-medium text-slate-900">{lookbook.tools.length}</dd>
                  </div>
                  {product?.article && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Артикул</dt>
                      <dd className="text-right font-medium text-slate-900">{product.article}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </section>

        {lookbook.richDescription && (
          <section className="pb-4">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-semibold text-slate-900">О наборе</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{lookbook.richDescription}</p>
              </div>
            </div>
          </section>
        )}

        <section className="py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-xl font-semibold text-slate-900">Характеристики каждого инструмента</h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Инструмент</th>
                    <th className="px-4 py-3">Роль в наборе</th>
                    <th className="px-4 py-3">Для каких работ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lookbook.tools.map((tool) => (
                    <tr key={tool.name}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{tool.name}</td>
                      <td className="px-4 py-3 text-slate-600">{tool.role}</td>
                      <td className="px-4 py-3 text-slate-600">{tool.useCases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Для каких работ подходит</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {lookbook.suitableFor.map((useCase) => (
                    <li key={useCase} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Гарантия и сервис</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Гарантийный срок на инструменты набора устанавливает производитель — точный срок уточняйте у менеджера при
                  оформлении заказа. При обнаружении производственного дефекта товар можно вернуть или обменять в
                  соответствии с законом «О защите прав потребителей».
                </p>
                <Link href="/help/warranty" prefetch={false} className="mt-3 inline-block text-sm font-semibold text-amber-600 hover:text-amber-700">
                  Подробнее об условиях гарантии →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-xl font-semibold text-slate-900">Сравнение наборов электроинструментов</h2>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Набор</th>
                    <th className="px-4 py-3">Инструментов</th>
                    <th className="px-4 py-3">Аккумуляторы</th>
                    <th className="px-4 py-3">Цена</th>
                    <th className="px-4 py-3">Наличие</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonRows.map((row) => {
                    const rowPrice = row.product?.salePrices?.[0]?.value;
                    const rowInStock = Boolean(row.product?.quantity && row.product.quantity > 0);
                    const isCurrent = row.lookbook.slug === lookbook.slug;
                    return (
                      <tr key={row.lookbook.slug} className={isCurrent ? "bg-amber-50/60" : undefined}>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {isCurrent ? row.lookbook.title : (
                            <Link href={`/lookbooks/${row.lookbook.slug}`} prefetch={false} className="hover:text-amber-600">
                              {row.lookbook.title}
                            </Link>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.lookbook.tools.length}</td>
                        <td className="px-4 py-3 text-slate-600">{row.lookbook.batteries}</td>
                        <td className="px-4 py-3 text-slate-600">{formatPrice(rowPrice) ?? "по запросу"}</td>
                        <td className={`px-4 py-3 font-medium ${rowInStock ? "text-green-600" : "text-slate-400"}`}>
                          {row.product ? (rowInStock ? "В наличии" : "Нет в наличии") : "Уточняется"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isCurrent && (
                            <Link href={`/lookbooks/${row.lookbook.slug}`} prefetch={false} className="text-xs font-semibold uppercase text-amber-600 hover:text-amber-700">
                              Открыть →
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/catalog"
                prefetch={false}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-amber-100 transition hover:bg-amber-500"
              >
                Смотреть весь каталог электроинструмента
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
