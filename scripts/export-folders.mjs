import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "folders-export.csv");

async function fetchAll(url, rows = []) {
  const res = await fetch(url);
  const data = await res.json();
  rows.push(...(data.rows ?? []));
  if (data.meta?.nextHref) {
    await fetchAll(data.meta.nextHref, rows);
  }
  return rows;
}

// Читаем токен из .env.local
import { readFileSync, existsSync } from "fs";
function getToken() {
  for (const f of [".env.local", ".env", "envir.env"]) {
    const p = join(__dirname, "..", f);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, "utf8").match(/^MOYSKLAD_TOKEN\s*=\s*["']?([^"'\r\n]+)/m);
    if (m?.[1]) return m[1].trim();
  }
  throw new Error("MOYSKLAD_TOKEN not found");
}

const TOKEN = getToken();
const BASE = "https://api.moysklad.ru/api/remap/1.2";
const HEADERS = { Authorization: `Bearer ${TOKEN}`, "Accept-Encoding": "gzip" };

async function apiFetch(path, params = {}) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const rows = data.rows ?? [];
  if (data.meta?.nextHref) {
    const next = await apiFetch("", {});
    // paginate manually
  }
  return { rows, meta: data.meta };
}

async function fetchAllPages(path, params = {}) {
  const rows = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const url = new URL(BASE + path);
    Object.entries({ ...params, limit, offset }).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { headers: HEADERS });
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    rows.push(...(data.rows ?? []));
    if (rows.length >= (data.meta?.size ?? 0)) break;
    offset += limit;
  }
  return rows;
}

console.log("Fetching folders...");
const folders = await fetchAllPages("/entity/productfolder", {
  order: "name,asc",
  expand: "productFolder",
});

console.log(`Got ${folders.length} folders. Fetching assortment sample...`);
const assortment = await fetchAllPages("/entity/assortment", {
  expand: "productFolder,productFolder.productFolder",
  limit: 100,
});

// Папки
const csvFolders = [
  "ID,Название,pathName,Родитель(name),Родитель(pathName)",
  ...folders.map((f) => [
    f.id,
    `"${(f.name ?? "").replace(/"/g, '""')}"`,
    `"${(f.pathName ?? "").replace(/"/g, '""')}"`,
    `"${(f.productFolder?.name ?? "").replace(/"/g, '""')}"`,
    `"${(f.productFolder?.pathName ?? "").replace(/"/g, '""')}"`,
  ].join(","))
];

// Товары
const csvItems = [
  "Название товара,productFolder.name,productFolder.pathName,productFolder.productFolder.name,row.pathName",
  ...assortment.map((r) => [
    `"${(r.name ?? "").replace(/"/g, '""')}"`,
    `"${(r.productFolder?.name ?? "").replace(/"/g, '""')}"`,
    `"${(r.productFolder?.pathName ?? "").replace(/"/g, '""')}"`,
    `"${(r.productFolder?.productFolder?.name ?? "").replace(/"/g, '""')}"`,
    `"${(r.pathName ?? "").replace(/"/g, '""')}"`,
  ].join(","))
];

const content = [
  "=== ПАПКИ ===",
  ...csvFolders,
  "",
  "=== ТОВАРЫ (первые 100) ===",
  ...csvItems,
].join("\r\n");

// UTF-8 BOM для Excel
const bom = "\uFEFF";
writeFileSync(OUT, bom + content, "utf8");
console.log(`Saved to: ${OUT}`);
console.log("\nСтруктура папок:");
folders.forEach((f) => {
  const path = f.pathName ? `${f.pathName} / ${f.name}` : f.name;
  const parent = f.productFolder?.name ?? "(корень)";
  console.log(`  [${parent}] → ${path}`);
});
