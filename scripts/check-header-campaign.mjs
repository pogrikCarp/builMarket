// Local regression check: start Next.js on port 3100, then run with --env-file=.env.
import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { encode } from "next-auth/jwt";

const base = new URL(process.env.BANNER_TEST_URL || "http://127.0.0.1:3100");
assert(["localhost", "127.0.0.1"].includes(base.hostname));
assert(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname));
const prisma = new PrismaClient();
const id = `header-check-${randomUUID()}`;
const files = [];
const original = await prisma.headerCampaign.findUnique({ where: { id: "main" } });
let changed = false;
const empty = { theme: "none", customImage: null, customTitle: "Сезонные акции", buttonLabel: "" };
const request = (route, options = {}) => fetch(new URL(route, base), options);
const state = async () => (await request("/api/header-campaign")).json();

try {
  assert.equal(await prisma.promoItem.count(), 0, "Use a local database without promo fixtures");
  const sessionName = "authjs.session-token";
  const headersFor = async (role) => ({ Cookie: `${sessionName}=${await encode({ secret: process.env.AUTH_SECRET, salt: sessionName, token: { id, role }, maxAge: 600 })}` });
  const admin = await headersFor("ADMIN");
  for (const headers of [{}, await headersFor("USER")]) {
    assert.equal((await request("/api/admin/header-campaign", { headers })).status, 403);
    assert.equal((await request("/api/admin/header-campaign", { method: "PUT", headers })).status, 403);
  }
  assert.equal((await request("/admin/appearance", { headers: admin })).status, 200);
  assert.equal((await request("/api/admin/header-campaign", { headers: admin })).status, 200);
  console.log("PASS: admin page, admin reads and authorization");

  const put = async (body) => request("/api/admin/header-campaign", { method: "PUT", headers: { ...admin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  for (const body of [
    { ...empty, theme: "unknown" }, { ...empty, theme: "custom" },
    { ...empty, customImage: "https://other.example/image.png" },
    { ...empty, customImage: "/uploads/../.env" },
    { ...empty, buttonLabel: "x".repeat(33) }, { ...empty, customTitle: " " },
  ]) assert.equal((await put(body)).status, 400);
  console.log("PASS: invalid themes, absent custom images, unsafe paths and overlong text rejected");

  for (const theme of ["sale-1111", "new-year", "black-friday", "spring", "none"]) {
    assert.equal((await put({ ...empty, theme })).status, 200);
    changed = true;
    assert.equal((await state()).campaign.theme, theme);
    assert.equal((await state()).hasPromos, false);
    if (theme !== "none") assert.equal((await request(`/header-themes/${theme}.webp`)).status, 200);
  }
  console.log("PASS: all four default stickers and disabled state persist; no CTA availability without promos");

  const form = new FormData();
  form.set("file", new File([await readFile("public/banner4.png")], "custom.png", { type: "image/png" }));
  const upload = await request("/api/admin/uploads", { method: "POST", headers: admin, body: form });
  assert.equal(upload.status, 201);
  const { url } = await upload.json();
  files.push(path.join(process.cwd(), "public", url));
  const custom = { ...empty, theme: "custom", customImage: url, customTitle: "Своя акция", buttonLabel: "Выбрать со скидкой" };
  assert.equal((await put(custom)).status, 200);
  assert.deepEqual((await state()).campaign, custom);
  assert.equal((await request(url)).status, 200);
  assert.equal((await put({ ...custom, theme: "new-year" })).status, 200);
  assert.equal((await state()).campaign.customImage, url);
  assert.equal((await put(custom)).status, 200);
  console.log("PASS: custom upload, custom CTA text and custom image preserved across default selections");

  await prisma.catalogProduct.create({ data: { id, entityType: "product", name: id, price: 10000, quantity: 1, images: [], attributes: [], searchText: id } });
  await prisma.promoItem.create({ data: { id, productId: id, oldPrice: 200, active: true } });
  assert.equal((await state()).hasPromos, true);
  assert((await (await request("/api/promo")).json()).items.some((item) => item.promoId === id));
  await prisma.promoItem.update({ where: { id }, data: { active: false } });
  assert.equal((await state()).hasPromos, false);
  await prisma.promoItem.update({ where: { id }, data: { active: true } });
  await prisma.catalogProduct.update({ where: { id }, data: { archived: true } });
  assert.equal((await state()).hasPromos, false);
  await prisma.catalogProduct.delete({ where: { id } });
  assert.equal((await state()).hasPromos, false);
  console.log("PASS: real active promo enables CTA availability; inactive, archived and missing products disable it");
} finally {
  await prisma.promoItem.deleteMany({ where: { id } });
  await prisma.catalogProduct.deleteMany({ where: { id } });
  if (changed) {
    if (original) await prisma.headerCampaign.upsert({ where: { id: "main" }, create: original, update: original });
    else await prisma.headerCampaign.deleteMany({ where: { id: "main" } });
  }
  await prisma.$disconnect();
  for (const file of files) await unlink(file).catch(() => {});
}
