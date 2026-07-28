import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = `https://api.moysklad.ru/api/remap/1.2`;
const ENV_FILES = [".env.local", ".env", "envir.env"];

function getTokenFromFile() {
  for (const fileName of ENV_FILES) {
    const filePath = join(process.cwd(), fileName);
    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, "utf8");
    const match = content.match(/^MOYSKLAD_TOKEN\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function getMoyskladToken() {
  return process.env.MOYSKLAD_TOKEN || getTokenFromFile();
}

export type MoyskladProductFolder = {
  meta: { href: string; type: string };
  id: string;
  name: string;
  pathName?: string;
  productFolder?: { meta: { href: string; type?: string }; name?: string };
};

export type MoyskladProductFolderResponse = {
  rows: MoyskladProductFolder[];
  meta: { size: number; limit: number; offset: number };
};

export type MoyskladAssortmentItem = {
  meta: {
    href: string;
    type: string;
  };
  id: string;
  name: string;
  code?: string;
  article?: string;
  salePrices?: {
    value: number;
    currency: { name: string };
  }[];
  quantity?: number;
  uom?: { name: string };
  productFolder?: {
    meta: { href: string; type: string };
    name?: string;
    pathName?: string;
    productFolder?: { meta: { href: string; type: string }; name?: string };
  };
};

export type MoyskladAssortmentResponse = {
  rows: MoyskladAssortmentItem[];
  meta: {
    size: number;
    limit: number;
    offset: number;
    total?: number;
  };
};

function getAuthHeaders() {
  const token = getMoyskladToken();
  if (!token) {
    throw new Error("MOYSKLAD_TOKEN is not set");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Accept-Encoding": "gzip",
  };
}

function buildUrl(path: string, params?: URLSearchParams) {
  const query = params ? `?${params.toString()}` : "";
  return `${BASE_URL}${path}${query}`;
}

export async function getAssortment(
  limit = 100,
  offset = 0,
  search?: string
): Promise<MoyskladAssortmentResponse> {
  const params = new URLSearchParams();
  params.append("limit", String(limit));
  params.append("offset", String(offset));
  params.append("expand", "productFolder,productFolder.productFolder");
  if (search) params.append("search", search);

  const url = buildUrl("/entity/assortment", params);

  const res = await fetch(url, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`MoySklad API error: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export async function getProductById(id: string): Promise<MoyskladAssortmentItem> {
  const url = buildUrl(`/entity/assortment/${id}`);
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) {
    throw new Error(`MoySklad API error: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function getProductFolders(): Promise<MoyskladProductFolderResponse> {
  const limit = 1000;
  let offset = 0;
  const rows: MoyskladProductFolder[] = [];
  let total = Infinity;

  while (offset < total) {
    const params = new URLSearchParams();
    params.append("limit", String(limit));
    params.append("offset", String(offset));
    params.append("order", "name,asc");
    params.append("expand", "productFolder");
    const url = buildUrl("/entity/productfolder", params);
    const res = await fetch(url, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`MoySklad API error: ${res.status} ${await res.text()}`);
    }
    const page: MoyskladProductFolderResponse = await res.json();
    rows.push(...page.rows);
    total = page.meta.size;
    offset += limit;
  }

  return {
    rows,
    meta: { size: rows.length, limit, offset: 0 },
  };
}

export async function getAssortmentByFolder(
  folderHref: string,
  limit = 100,
  offset = 0
): Promise<MoyskladAssortmentResponse> {
  const params = new URLSearchParams();
  params.append("limit", String(limit));
  params.append("offset", String(offset));
  // withSubFolders=true (значение по умолчанию в МойСклад, но задаём явно) гарантирует,
  // что при выборе раздела в выдачу попадут и товары всех его подкатегорий.
  params.append("filter", `productFolder=${folderHref};withSubFolders=true`);
  params.append("expand", "productFolder,productFolder.productFolder");
  const url = buildUrl("/entity/assortment", params);
  const res = await fetch(url, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`MoySklad API error: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
