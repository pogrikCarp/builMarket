// Run against a LOCAL production server: npm start -- --port 3100
// Then: node --env-file=.env scripts/check-banner-media.mjs
import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { encode } from "next-auth/jwt";

const base = new URL(process.env.BANNER_TEST_URL || "http://127.0.0.1:3100");
assert(["localhost", "127.0.0.1"].includes(base.hostname), "Only run against a local test server");
assert(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname), "Only use a local test database");
const prisma = new PrismaClient();
const ids = [];
const files = [];
const title = `banner-regression-${randomUUID()}`;

async function headersFor(role) {
  const name = "authjs.session-token";
  const token = await encode({ secret: process.env.AUTH_SECRET, salt: name, token: { id: title, role }, maxAge: 600 });
  return { Cookie: `${name}=${token}` };
}

async function request(route, options = {}) {
  return fetch(new URL(route, base), options);
}

try {
  assert.equal((await request("/api/health")).status, 200);
  const admin = await headersFor("ADMIN");
  const user = await headersFor("USER");
  for (const headers of [{}, user]) {
    assert.equal((await request("/api/admin/banners", { headers })).status, 403);
    assert.equal((await request("/api/admin/banners", { method: "POST", headers })).status, 403);
    assert.equal((await request("/api/admin/banners/missing", { method: "PATCH", headers })).status, 403);
    assert.equal((await request("/api/admin/banners/missing", { method: "DELETE", headers })).status, 403);
    assert.equal((await request("/api/admin/uploads", { method: "POST", headers })).status, 403);
  }
  console.log("PASS: anonymous and regular users cannot change banners or upload files");

  for (const route of ["orders", "users", "pages", "redirects", "promo", "catalog-sync"]) {
    assert.equal((await request(`/api/admin/${route}`)).status, 403);
    assert.equal((await request(`/api/admin/${route}`, { headers: admin })).status, 200, `admin ${route} must load`);
  }
  for (const route of ["", "/catalog", "/orders", "/users", "/pages", "/seo", "/promo", "/banners"]) {
    assert.equal((await request(`/admin${route}`, { headers: admin })).status, 200);
  }
  console.log("PASS: admin sections and their read APIs load with an admin session");

  for (const file of [new File([], "empty.png", { type: "image/png" }), new File(["text"], "bad.txt", { type: "text/plain" }), new File([new Uint8Array(8 * 1024 * 1024 + 1)], "large.png", { type: "image/png" })]) {
    const body = new FormData();
    body.set("file", file);
    assert.equal((await request("/api/admin/uploads", { method: "POST", headers: admin, body })).status, 400);
  }
  const original = await readFile("public/banner4.png");
  const form = new FormData();
  form.set("file", new File([original], "banner.png", { type: "image/png" }));
  const upload = await request("/api/admin/uploads", { method: "POST", headers: admin, body: form });
  assert.equal(upload.status, 201);
  const { url } = await upload.json();
  files.push(path.join(process.cwd(), "public", url));
  const image = await request(url);
  assert.equal(image.status, 200, "new file must be served without restarting Next.js");
  assert.equal(image.headers.get("content-type"), "image/png");
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), original);
  const optimized = await request(`/_next/image?url=${encodeURIComponent(url)}&w=640&q=75`);
  assert.equal(optimized.status, 200, "Next Image must also serve a runtime upload");
  assert.equal((await request("/uploads/missing.png")).status, 404);
  assert.equal((await request("/uploads/.env")).status, 404);
  assert.equal((await request("/uploads/invalid%5Cpath.png")).status, 404);
  console.log("PASS: upload validation, runtime file serving, image optimization and path restrictions");

  for (const type of ["HERO", "LOOKBOOK", "CERTIFICATE", "BRAND"]) {
    assert.equal(await prisma.banner.count({ where: { type, sortOrder: 0 } }), 0, "test slot must be empty");
    const body = { type, title, image: url, sortOrder: 0, active: true };
    const created = await request("/api/admin/banners", { method: "POST", headers: { ...admin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    assert.equal(created.status, 201);
    const { banner } = await created.json();
    ids.push(banner.id);
    const duplicate = await prisma.banner.create({ data: { ...body, image: "/banner4.png", updatedAt: new Date("2020-01-01") } });
    ids.push(duplicate.id);
    const content = (await (await request("/api/home-content")).json()).content;
    assert.equal(content.find((item) => item.type === type && item.sortOrder === 0).image, url, "newest override must win");
    const patched = await request(`/api/admin/banners/${banner.id}`, { method: "PATCH", headers: { ...admin, "Content-Type": "application/json" }, body: JSON.stringify({ image: url, startsAt: null, endsAt: null, active: true }) });
    assert.equal(patched.status, 200);
    assert.equal((await request(`/api/admin/banners/${banner.id}`, { method: "DELETE", headers: admin })).status, 200);
    assert.equal(await prisma.banner.count({ where: { type, sortOrder: 0 } }), 0, "reset must remove all overrides for the default slot");
  }
  const added = await prisma.banner.create({ data: { type: "BRAND", title, image: url, sortOrder: 10000 } });
  ids.push(added.id);
  assert.equal((await request(`/api/admin/banners/${added.id}`, { method: "DELETE", headers: admin })).status, 200);
  assert.equal((await request(`/api/admin/banners/${added.id}`, { method: "DELETE", headers: admin })).status, 200);
  const list = await request("/api/admin/banners", { headers: admin });
  assert.equal(list.status, 200);
  assert(!((await list.json()).banners).some((banner) => ids.includes(banner.id)));
  console.log("PASS: create, replace, public visibility, reset with duplicates, add/remove and admin listing");

  const sql = await readFile("prisma/migrations/20261028150000_restore_original_hero/migration.sql", "utf8");
  const rollback = new Error("rollback test fixture");
  await prisma.$transaction(async (tx) => {
    const old = await tx.banner.create({ data: { type: "HERO", title, sortOrder: 0, image: "/uploads/1793195860900-a7d749f2-c656-4eb3-9947-1c360a87f7ec.png" } });
    const later = await tx.banner.create({ data: { type: "HERO", title, sortOrder: 0, image: "/uploads/later.png" } });
    await tx.$executeRawUnsafe(sql);
    const restored = await tx.banner.findUniqueOrThrow({ where: { id: old.id } });
    assert.equal(restored.active, false);
    assert.equal(restored.image, null);
    assert.equal((await tx.banner.findUniqueOrThrow({ where: { id: later.id } })).image, "/uploads/later.png");
    throw rollback;
  }).catch((error) => { if (error !== rollback) throw error; });
  console.log("PASS: recovery migration restores the broken slide and preserves later admin edits");
} finally {
  await prisma.banner.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
  for (const file of files) await unlink(file).catch(() => {});
}
