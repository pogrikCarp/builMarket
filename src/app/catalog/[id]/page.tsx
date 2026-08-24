import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import CartButton from "@/components/cart/CartButton";
import ProductCartControl from "@/components/cart/ProductCartControl";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import ProductFavoriteToggle from "@/components/favorites/ProductFavoriteToggle";
import ProductGallery from "@/components/ProductGallery";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import { formatAttributeValue, getItemGalleryUrls, getProductById, getProductFolders } from "@/lib/moysklad";
import { getFolderPath } from "@/lib/folder-tree";
import { buildBreadcrumbJsonLd, buildMetadata, buildProductJsonLd } from "@/lib/seo";

function formatPrice(value?: number) {
  if (value == null) return null;
  return (value / 100).toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });
}

type ProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ type?: string }>;
};

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const { type } = (await searchParams) ?? {};

  try {
    const item = await getProductById(id, type);
    if (!item?.name) throw new Error("Товар не найден");

    const images = getItemGalleryUrls(item);
    const description =
      item.description?.trim() || `${item.name} — купить в ДомСтрой с доставкой по Москве и Московской области.`;

    return buildMetadata({
      title: item.name,
      description: description.length > 300 ? `${description.slice(0, 297)}...` : description,
      path: `/catalog/${id}`,
      image: images[0],
    });
  } catch {
    return buildMetadata({
      title: "Товар не найден",
      description: "Запрошенный товар не найден в каталоге ДомСтрой.",
      path: `/catalog/${id}`,
      noindex: true,
    });
  }
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params;
  const { type } = (await searchParams) ?? {};

  let item;
  try {
    item = await getProductById(id, type);
  } catch {
    notFound();
  }

  if (!item || !item.name) {
    notFound();
  }

  const price = item.salePrices?.[0]?.value;
  const images = getItemGalleryUrls(item);
  const attributes = (item.attributes ?? [])
    .map((attribute) => ({ name: attribute.name, value: formatAttributeValue(attribute.value) }))
    .filter((attribute): attribute is { name: string; value: string } => Boolean(attribute.value));
  const brandAttribute = attributes.find((attribute) => /бренд|производител/i.test(attribute.name));

  // Полный список папок нужен, чтобы построить цепочку раздел → категория → подкатегория
  // с рабочими ссылками на каждый уровень (МойСклад отдаёт вложенность до 3 уровней).
  // ID папки берём из поля id, а не из meta.href — при глубоком expand (productFolder.productFolder)
  // МойСклад иногда дописывает в href родителя "?expand=productFolder", из-за чего разбор
  // ссылки на "/" даёт мусор вместо чистого id и цепочка ломается.
  const foldersResult = await getProductFolders().catch(() => ({ rows: [] }));
  const immediateFolderId = item.productFolder?.id;
  const immediateFolder = immediateFolderId
    ? foldersResult.rows.find((folder) => folder.id === immediateFolderId)
    : undefined;
  const folderPath = immediateFolder ? getFolderPath(immediateFolder, foldersResult.rows) : [];

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <JsonLd
        data={buildProductJsonLd({
          id,
          name: item.name,
          description: item.description,
          images,
          price: price != null ? price / 100 : undefined,
          inStock: Boolean(item.quantity && item.quantity > 0),
          brand: brandAttribute?.value,
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Главная", path: "/" },
          { name: "Каталог", path: "/catalog" },
          ...folderPath.map((folder) => ({ name: folder.name, path: `/catalog?folder=${folder.id}` })),
          { name: item.name, path: `/catalog/${id}` },
        ])}
      />
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex shrink-0 items-center">
            <Image src="/logo.png" alt="ДомСтрой" width={110} height={52} className="h-10 w-auto object-contain sm:h-12" />
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-slate-600 hover:text-slate-900">Главная</Link>
            <Link href="/catalog" prefetch={false} className="font-semibold text-amber-600">Каталог</Link>
            <Link href="/personal" className="text-slate-600 hover:text-slate-900">Кабинет</Link>
            <FavoriteButton variant="inline" />
            <CartButton variant="inline" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          <Link href="/catalog" prefetch={false} className="hover:text-amber-600">Каталог</Link>
          {folderPath.map((folder) => (
            <span key={folder.id} className="flex items-center gap-1.5">
              <span>/</span>
              <Link href={`/catalog?folder=${folder.id}`} prefetch={false} className="hover:text-amber-600">{folder.name}</Link>
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span>/</span>
            <span className="text-slate-700">{item.name}</span>
          </span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ProductGallery images={images} alt={item.name} />

          <div>
            <h1 className="text-2xl font-semibold leading-snug text-slate-900 sm:text-3xl">{item.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              {item.article && <span>Артикул: {item.article}</span>}
              {item.code && <span>Код: {item.code}</span>}
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-4">
              {formatPrice(price) ? (
                <span className="text-3xl font-bold text-amber-600">{formatPrice(price)}</span>
              ) : (
                <span className="text-lg text-slate-400">Цена по запросу</span>
              )}
              {item.uom?.name && <span className="pb-1 text-sm text-slate-400">за {item.uom.name}</span>}
            </div>

            <p className={`mt-3 text-sm font-medium ${item.quantity && item.quantity > 0 ? "text-green-600" : "text-slate-400"}`}>
              {item.quantity && item.quantity > 0 ? `● В наличии: ${item.quantity}` : "Нет в наличии"}
            </p>

            <div className="mt-6 flex items-center gap-3">
              <ProductCartControl item={item} size="md" />
              <ProductFavoriteToggle item={item} imageUrl={images[0]} size="md" />
            </div>

            {attributes.length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-semibold text-slate-900">Характеристики</h2>
                <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                  {attributes.map((attribute) => (
                    <div key={attribute.name} className="flex justify-between gap-4 px-4 py-3 text-sm">
                      <dt className="text-slate-500">{attribute.name}</dt>
                      <dd className="text-right font-medium text-slate-900">{attribute.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {item.description && (
              <div className="mt-10">
                <h2 className="text-lg font-semibold text-slate-900">Описание</h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
