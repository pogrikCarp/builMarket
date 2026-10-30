export type BrandProfileInput = {
  name: string; logo: string; tagline: string; description: string[];
  categories: string[]; advantages: string[]; searchTerm: string; productIds: string[];
  active: boolean; showOnHome: boolean; sortOrder: number; seoTitle: string; seoDescription: string;
};

export function brandSlug(name: string) {
  const letters: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };
  return name.toLowerCase().split("").map(c => letters[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80).replace(/-$/, "");
}

export function validBrandSlug(value: string) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80; }

export function parseBrandInput(body: unknown): BrandProfileInput {
  if (!body || typeof body !== "object") throw new Error("Некорректные данные бренда");
  const data = body as Record<string, unknown>;
  const text = (key: string, max: number) => {
    if (typeof data[key] !== "string" || data[key].length > max) throw new Error(`Проверьте поле «${key}» (не более ${max} символов)`);
    return data[key].trim();
  };
  const list = (key: string, count: number, length: number) => {
    const values = data[key];
    if (!Array.isArray(values) || values.length > count || values.some(value => typeof value !== "string" || value.length > length)) throw new Error(`Проверьте поле «${key}»`);
    return [...new Set((values as string[]).map(value => value.trim()).filter(Boolean))];
  };
  const name = text("name", 160);
  const logo = text("logo", 1000);
  if (!name) throw new Error("Укажите название бренда");
  if (!/^\/(?!\/)[^\s?#]+\.(?:png|jpe?g|webp|gif|svg)$/i.test(logo)) throw new Error("Загрузите логотип или укажите путь к изображению на сайте");
  if (typeof data.active !== "boolean" || typeof data.showOnHome !== "boolean") throw new Error("Проверьте статус публикации");
  const sortOrder = Number(data.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) throw new Error("Порядок должен быть числом от 0 до 10000");
  return { name, logo, tagline: text("tagline", 400), description: list("description", 50, 10000),
    categories: list("categories", 50, 200), advantages: list("advantages", 50, 1000),
    searchTerm: text("searchTerm", 200), productIds: list("productIds", 24, 100),
    active: data.active, showOnHome: data.showOnHome, sortOrder,
    seoTitle: text("seoTitle", 200), seoDescription: text("seoDescription", 400) };
}
