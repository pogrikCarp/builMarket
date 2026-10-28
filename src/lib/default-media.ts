import { LOOKBOOKS } from "./lookbooks";
import { BRANDS } from "./brands";

export type MediaType = "HERO" | "LOOKBOOK" | "CERTIFICATE" | "BRAND";
export type DefaultMedia = {
  type: MediaType;
  sortOrder: number;
  title: string;
  image: string;
};

// These originals live in Git. Admin uploads only override a slot, never its original.
export const HERO_IMAGES = ["/banner4.png", "/main3.png", "/car2.png", "/car3.png"];

export const CERTIFICATES = [
  { id: 1, title: "Сертификат соответствия", image: "/sertificat/sert1.png" },
  { id: 2, title: "Лицензия на поставку", image: "/sertificat/sert2.png" },
  { id: 3, title: "Партнерский статус", image: "/sertificat/sert3.png" },
  { id: 4, title: "Сертификат качества", image: "/sertificat/sert4.png" },
  { id: 5, title: "Экологическая безопасность", image: "/sertificat/sert5.png" },
  { id: 6, title: "Технический допуск", image: "/sertificat/sert6.png" },
];

export const DEFAULT_MEDIA: DefaultMedia[] = [
  ...HERO_IMAGES.map((image, sortOrder) => ({ type: "HERO" as const, sortOrder, title: `Главный баннер ${sortOrder + 1}`, image })),
  ...LOOKBOOKS.map((item, sortOrder) => ({ type: "LOOKBOOK" as const, sortOrder, title: item.title, image: item.image })),
  ...CERTIFICATES.map((item, sortOrder) => ({ type: "CERTIFICATE" as const, sortOrder, title: item.title, image: item.image })),
  ...BRANDS.map((item, sortOrder) => ({ type: "BRAND" as const, sortOrder, title: item.name, image: item.logo })),
];

export function getDefaultMedia(type: string, sortOrder: number) {
  return DEFAULT_MEDIA.find((item) => item.type === type && item.sortOrder === sortOrder);
}
