// Run against a LOCAL running app: node --env-file=.env scripts/check-brand-publication.mjs
// Creates only named QA brand/banner fixtures; catalog products/folders are read-only.
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { encode } from "next-auth/jwt";

const base = process.argv[2] ?? "http://localhost:3100";
assert.equal(new URL(base).hostname, "localhost", "QA must run locally");
assert.equal(new URL(process.env.DATABASE_URL).hostname, "localhost", "QA database must be local");
const prisma = new PrismaClient();
const slug = `qa-brand-${randomUUID()}`;
const legacyId = `qa-legacy-${randomUUID()}`;
const legacySlug = `brand-${legacyId}`;
const catalogHash = async () => createHash("sha256").update(JSON.stringify({
  products: await prisma.catalogProduct.findMany({ orderBy: { id: "asc" } }),
  folders: await prisma.catalogFolder.findMany({ orderBy: { id: "asc" } }),
})).digest("hex");
const before = await catalogHash();
const cookieName = "authjs.session-token";
const cookie = await encode({ secret: process.env.AUTH_SECRET, salt: cookieName,
  token: { id: "local-brand-qa", email: "local-qa@example.invalid", role: "ADMIN" }, maxAge: 600 });
const request = (path, method = "GET", body) => fetch(`${base}${path}`, {
  method, headers: { Cookie: `${cookieName}=${cookie}`, "Content-Type": "application/json" },
  ...(body ? { body: JSON.stringify(body) } : {}),
});
const html = async path => (await fetch(`${base}${path}`)).text();
const payload = { name: "Проверка публикации бренда", logo: "/comp/edon.jpg", tagline: "Тестовая страница",
  description: ["Первый абзац.", "Второй абзац."], categories: ["Инструменты"], advantages: ["Подборка"],
  searchTerm: "Edon", productIds: [], active: true, showOnHome: true, sortOrder: 9000,
  seoTitle: "QA Brand SEO", seoDescription: "QA description" };

try {
  for (const [path, method, body] of [["/api/admin/brands", "GET"], ["/api/admin/brands", "POST", payload], [`/api/admin/brands/${slug}`, "PUT", payload]]) {
    const result = await fetch(`${base}${path}`, { method, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
    assert.equal(result.status, 403, `${method} must require admin`);
  }
  assert.equal((await request("/api/admin/brands", "POST", { ...payload, slug, logo: "https://example.com/logo.png" })).status, 400);
  const selected = await prisma.catalogProduct.findFirstOrThrow({ where: { archived: false, name: { contains: "Edon", mode: "insensitive" } } });
  payload.productIds = [selected.id];
  assert.equal((await request("/api/admin/brands", "POST", { ...payload, slug })).status, 201);
  assert.equal((await request("/api/admin/brands", "POST", { ...payload, slug })).status, 409, "Duplicate slugs must not overwrite a page");
  let page = await html(`/brands/${slug}`);
  assert(page.includes("QA Brand SEO") && page.includes("QA description"));
  assert(page.includes(`/brands/${slug}`) && page.includes('"@type":"Brand"'));
  assert(page.includes(`/catalog/${selected.id}`), "Selected catalog product must appear");
  assert(page.includes("/catalog?q=Edon"), "Brand must link to filtered catalog");
  assert(page.includes("Первый абзац.") && page.includes("Второй абзац."));
  assert((await html("/")).includes(`href="/brands/${slug}"`), "Homepage logo must be a link");
  let sitemap = await html("/sitemap.xml");
  assert(sitemap.includes(`/brands/${slug}</loc>`) && sitemap.includes("<lastmod>"));
  const ids = await prisma.catalogProduct.findMany({ where: { archived: false }, select: { id: true } });
  assert(ids.every(product => sitemap.includes(`/catalog/${product.id}</loc>`)), "Every active local product must be in sitemap");
  assert((await html("/robots.txt")).includes("/sitemap.xml"));
  assert.equal((await request(`/api/admin/brands/${slug}`, "PUT", { ...payload, productIds: [], showOnHome: false })).status, 200);
  assert(!(await html("/")).includes(`href="/brands/${slug}"`));
  assert((await html("/brands")).includes(`href="/brands/${slug}"`));
  assert((await html(`/brands/${slug}`)).includes("Популярные товары"), "Automatic selection must use existing catalog search");

  // Existing logo-only brands also get linked pages and can be edited in place.
  await prisma.banner.create({ data: { id: legacyId, type: "BRAND", title: "Legacy QA", image: "/comp/edon.jpg", sortOrder: 9001 } });
  assert((await html("/")).includes(`href="/brands/${legacySlug}"`));
  assert((await html(`/brands/${legacySlug}`)).includes("Legacy QA"));
  assert.equal((await request(`/api/admin/brands/${legacySlug}`, "PUT", { ...payload, active: false })).status, 200);
  assert(!(await html("/")).includes(`href="/brands/${legacySlug}"`), "Hidden legacy profile must not fall back to its old banner");

  assert.equal((await request(`/api/admin/brands/${slug}`, "PUT", { ...payload, active: false })).status, 200);
  assert(!(await html("/")).includes(`href="/brands/${slug}"`));
  sitemap = await html("/sitemap.xml");
  assert(!sitemap.includes(`/brands/${slug}</loc>`));
  page = await html(`/brands/${slug}`);
  assert(page.includes("noindex"), "Draft pages must not be indexed");
  assert.equal(await catalogHash(), before, "Catalog products/folders must remain byte-for-byte unchanged");
  console.log(`PASS: admin authorization, validation, duplicate slugs, publication, selected products, homepage links, legacy logos, drafts, metadata, robots and ${ids.length} sitemap products; catalog unchanged.`);
} finally {
  await prisma.brandProfile.deleteMany({ where: { slug: { in: [slug, legacySlug] } } });
  await prisma.banner.deleteMany({ where: { id: legacyId } });
  await prisma.$disconnect();
}
