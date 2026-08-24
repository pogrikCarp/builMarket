import type { Metadata } from "next";

export const SITE_NAME = "ДомСтрой";

// Домен продакшн-сайта. Можно переопределить через NEXT_PUBLIC_SITE_URL,
// если проект развернут на другом домене (staging и т.п.).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://marketdomstroy.ru").replace(/\/+$/, "");

// Изображение по умолчанию для Open Graph / Twitter Card, если у страницы нет своего.
export const DEFAULT_OG_IMAGE = "/banner4.png";

// Единые реквизиты компании - используются в JSON-LD (Organization/LocalBusiness)
// и должны совпадать с тем, что реально указано на /contacts и /requisites.
export const BUSINESS = {
  name: SITE_NAME,
  legalName: "ИП Магомедшерифов Качмаз Шахвеледович",
  telephone: "+7-916-004-55-22",
  email: "info@marketdomstroy.ru",
  streetAddress: "Верхняя улица, 15/1, деревня Кутузово",
  addressLocality: "городской округ Домодедово",
  addressRegion: "Московская область",
  addressCountry: "RU",
  latitude: 55.36863,
  longitude: 37.894418,
  openingHours: "Mo-Su 10:00-18:00",
  sameAs: ["https://vk.ru/domstroy_market", "https://t.me/domstroy_market"],
} as const;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type BuildMetadataOptions = {
  // Короткий заголовок страницы БЕЗ названия бренда - суффикс "— ДомСтрой"
  // подставляется автоматически через title.template в корневом layout.
  // Используй titleAbsolute вместо title, если нужен title без этого суффикса
  // (например, для главной страницы, где бренд уже стоит первым словом).
  title?: string;
  titleAbsolute?: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  keywords?: string[];
};

/**
 * Единая точка сборки metadata для страниц: title, description, canonical,
 * Open Graph и Twitter Card. Используется вместо ручного дублирования одних
 * и тех же полей в каждом page.tsx.
 */
export function buildMetadata({
  title,
  titleAbsolute,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  keywords,
}: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const plainTitle = titleAbsolute ?? title ?? SITE_NAME;

  return {
    title: titleAbsolute ? { absolute: titleAbsolute } : title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    openGraph: {
      title: plainTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: plainTitle }],
      locale: "ru_RU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: plainTitle,
      description,
      images: [imageUrl],
    },
  };
}

/** Schema.org LocalBusiness - используется в корневом layout, т.к. описывает всю компанию. */
export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HardwareStore",
    "@id": `${SITE_URL}/#organization`,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    url: SITE_URL,
    logo: absoluteUrl("/logo.png"),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    telephone: BUSINESS.telephone,
    email: BUSINESS.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.addressLocality,
      addressRegion: BUSINESS.addressRegion,
      addressCountry: BUSINESS.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.latitude,
      longitude: BUSINESS.longitude,
    },
    openingHours: BUSINESS.openingHours,
    sameAs: BUSINESS.sameAs,
  };
}

/** Schema.org WebSite с SearchAction - подсказывает поисковикам форму поиска по каталогу. */
export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "ru-RU",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/catalog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export type BreadcrumbItem = { name: string; path: string };

/** Schema.org BreadcrumbList - для страниц каталога, товара, наборов. */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export type ProductJsonLdInput = {
  id: string;
  name: string;
  description?: string;
  images: string[];
  price?: number;
  currency?: string;
  inStock?: boolean;
  brand?: string;
};

/** Schema.org Product+Offer - для карточки товара. Цена передаётся уже в рублях (не в копейках). */
export function buildProductJsonLd(input: ProductJsonLdInput) {
  const url = absoluteUrl(`/catalog/${input.id}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.images.map((src) => absoluteUrl(src)),
    url,
    ...(input.brand ? { brand: { "@type": "Brand", name: input.brand } } : {}),
    ...(input.price != null
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: input.currency ?? "RUB",
            price: input.price.toFixed(2),
            availability: input.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };
}

/** Schema.org FAQPage - для страницы вопрос-ответ. */
export function buildFaqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
