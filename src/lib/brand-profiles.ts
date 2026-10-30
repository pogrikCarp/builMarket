import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { BRANDS, type Brand } from "@/lib/brands";
import type { BrandProfileInput } from "@/lib/brand-profile-input";

export type ManagedBrand = Brand & BrandProfileInput & { updatedAt: string | null; source: "default" | "legacy" | "custom" };
export type BrandSummary = Pick<ManagedBrand, "slug" | "name" | "logo"> & { fallbackSrc: string };

// Built-in profiles and old logo-only banners stay available without rewriting
// their records. Saving in the constructor creates a managed override by slug.
export const getManagedBrands = cache(async (): Promise<ManagedBrand[]> => {
  const [profiles, media] = await Promise.all([
    prisma.brandProfile.findMany(),
    prisma.banner.findMany({ where: { type: "BRAND" }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }] }),
  ]);
  const now = new Date();
  const visibleMedia = media.filter(item => item.active && (!item.startsAt || item.startsAt <= now) && (!item.endsAt || item.endsAt >= now));
  const defaults: ManagedBrand[] = BRANDS.map((brand, index) => {
    const logo = visibleMedia.find(item => item.sortOrder === index);
    return { ...brand, logo: logo?.image || brand.logo, inCatalog: Boolean(brand.searchTerm),
      productIds: [], active: true, showOnHome: true, sortOrder: index,
      seoTitle: "", seoDescription: "", updatedAt: logo?.updatedAt.toISOString() ?? null, source: "default" };
  });
  const legacy: ManagedBrand[] = media.filter(item => item.sortOrder >= BRANDS.length && item.image).map(item => ({
    slug: `brand-${item.id}`, name: item.title, logo: item.image!, tagline: item.subtitle ?? "", description: [], categories: [], advantages: [],
    searchTerm: item.title, inCatalog: true, productIds: [], active: visibleMedia.some(banner => banner.id === item.id),
    showOnHome: true, sortOrder: item.sortOrder, seoTitle: "", seoDescription: "", updatedAt: item.updatedAt.toISOString(), source: "legacy",
  }));
  const result = new Map([...defaults, ...legacy].map(brand => [brand.slug, brand]));
  for (const profile of profiles) result.set(profile.slug, { ...profile, updatedAt: profile.updatedAt.toISOString(),
    inCatalog: Boolean(profile.searchTerm || profile.productIds.length), source: result.get(profile.slug)?.source ?? "custom" });
  return [...result.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ru"));
});

export const getPublishedBrands = cache(async () => (await getManagedBrands()).filter(brand => brand.active));
export const getPublishedBrand = cache(async (slug: string) => (await getPublishedBrands()).find(brand => brand.slug === slug));
export function brandSummary(brand: ManagedBrand): BrandSummary {
  return { slug: brand.slug, name: brand.name, logo: brand.logo, fallbackSrc: BRANDS.find(item => item.slug === brand.slug)?.logo ?? brand.logo };
}
