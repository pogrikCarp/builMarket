import { readFileSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "export-full.csv");

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
const HEADERS = { Authorization: `Bearer ${TOKEN}` };

function esc(v) {
  if (v == null) return "";
  return `"${String(v).replace(/"/g, '""')}"`;
}

async function fetchAllPages(path, params = {}) {
  const rows = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const url = new URL(BASE + path);
    Object.entries({ ...params, limit, offset }).forEach(([k, v]) =>
      url.searchParams.set(k, String(v))
    );
    const res = await fetch(url.toString(), { headers: HEADERS });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const chunk = data.rows ?? [];
    rows.push(...chunk);
    const total = data.meta?.size ?? 0;
    process.stdout.write(`\r  ${rows.length} / ${total}  `);
    if (rows.length >= total || chunk.length === 0) break;
    offset += limit;
  }
  console.log();
  return rows;
}

console.log("Загружаю ассортимент...");
const items = await fetchAllPages("/entity/assortment", {
  expand: "productFolder,productFolder.productFolder,attributes",
});

console.log(`Всего товаров: ${items.length}`);

// Собираем все уникальные имена атрибутов
const attrNames = [...new Set(
  items.flatMap(item => (item.attributes ?? []).map(a => a.name))
)].sort();

// Заголовки
const headers = [
  "ID",
  "Тип",
  "Название",
  "Артикул",
  "Код",
  "pathName (row)",
  "productFolder.name",
  "productFolder.pathName",
  "productFolder.productFolder.name",
  "Цена продажи",
  "Цена закупки",
  "Остаток",
  ...attrNames,
];

const lines = [headers.map(esc).join(";")];

for (const item of items) {
  const folder = item.productFolder ?? {};
  const parentFolder = folder.productFolder ?? {};
  const salePrice = item.salePrices?.[0]?.value != null
    ? (item.salePrices[0].value / 100).toFixed(2)
    : "";
  const buyPrice = item.buyPrice?.value != null
    ? (item.buyPrice.value / 100).toFixed(2)
    : "";
  const attrMap = {};
  (item.attributes ?? []).forEach(a => { attrMap[a.name] = a.value; });

  const row = [
    item.id,
    item.meta?.type,
    item.name,
    item.article,
    item.code,
    item.pathName,
    folder.name,
    folder.pathName,
    parentFolder.name,
    salePrice,
    buyPrice,
    item.quantity,
    ...attrNames.map(n => attrMap[n] ?? ""),
  ];

  lines.push(row.map(esc).join(";"));
}

const bom = "\uFEFF";
writeFileSync(OUT, bom + lines.join("\r\n"), "utf8");

console.log(`\nФайл сохранён: ${OUT}`);
console.log(`Строк: ${lines.length - 1}`);
console.log(`Атрибутов найдено: ${attrNames.length}`);
if (attrNames.length) {
  console.log("Атрибуты:", attrNames.join(", "));
}

// Итог по папкам
const folderCount = {};
items.forEach(item => {
  const key = item.productFolder?.name ?? "(без папки)";
  folderCount[key] = (folderCount[key] ?? 0) + 1;
});
console.log("\nРаспределение по папкам:");
Object.entries(folderCount).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => {
  console.log(`  ${k}: ${v} шт.`);
});
