"use client";
/* eslint-disable @next/next/no-img-element -- The operator previews original uploaded logos. */

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { brandSlug } from "@/lib/brand-profile-input";
import { BRANDS } from "@/lib/brands";
import type { ManagedBrand } from "@/lib/brand-profiles";

type Editor = Omit<ManagedBrand, "description" | "categories" | "advantages"> & {
  description: string; categories: string; advantages: string;
};
type Product = { id: string; name: string; code?: string; article?: string };
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
const lines = (value: string) => value.split(/\n+/).map(line => line.trim()).filter(Boolean);
const toEditor = (brand: ManagedBrand): Editor => ({ ...brand, description: brand.description.join("\n\n"), categories: brand.categories.join("\n"), advantages: brand.advantages.join("\n") });
const emptyBrand = (order: number): Editor => ({ slug: "", name: "", logo: "", tagline: "", description: "", categories: "", advantages: "", searchTerm: "", productIds: [], active: false, showOnHome: true, sortOrder: order, seoTitle: "", seoDescription: "", updatedAt: null, source: "custom", inCatalog: true });

async function responseData(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? `Ошибка запроса (${response.status})`);
  return data;
}

export default function BrandsManager({ initialBrands, initialProducts }: { initialBrands: ManagedBrand[]; initialProducts: Product[] }) {
  const [brands, setBrands] = useState(initialBrands);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState("");
  const [knownProducts, setKnownProducts] = useState<Record<string, Product>>(() => Object.fromEntries(initialProducts.map(product => [product.id, product])));
  const editorOpen = editor !== null;

  useEffect(() => {
    if (!editorOpen) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setProductLoading(true); setProductError("");
      try {
        const data = await responseData(await fetch(`/api/moysklad/assortment?limit=24&search=${encodeURIComponent(productQuery)}`, { signal: controller.signal }));
        if (controller.signal.aborted) return;
        const rows = data.rows as Product[];
        setProducts(rows);
        setKnownProducts(current => ({ ...current, ...Object.fromEntries(rows.map(row => [row.id, row])) }));
      } catch (reason) { if (!controller.signal.aborted) setProductError(reason instanceof Error ? reason.message : "Не удалось загрузить товары"); }
      finally { if (!controller.signal.aborted) setProductLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [productQuery, editingSlug, editorOpen]);

  const edit = (brand: ManagedBrand) => { setEditor(toEditor(brand)); setEditingSlug(brand.slug); setProductQuery(brand.searchTerm); setError(""); setNotice(""); };
  const change = <K extends keyof Editor>(key: K, value: Editor[K]) => setEditor(current => current ? { ...current, [key]: value } : current);
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!editor || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const payload = { ...editor, slug: editor.slug || brandSlug(editor.name), searchTerm: editor.searchTerm.trim(),
        description: editor.description.trim().split(/\n\s*\n/).map(p => p.trim()).filter(Boolean), categories: lines(editor.categories), advantages: lines(editor.advantages) };
      const data = await responseData(await fetch(editingSlug ? `/api/admin/brands/${editingSlug}` : "/api/admin/brands", {
        method: editingSlug ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      }));
      const updated = await responseData(await fetch("/api/admin/brands", { cache: "no-store" }));
      setBrands(updated.brands); setEditingSlug(data.brand.slug); setEditor(toEditor(updated.brands.find((brand: ManagedBrand) => brand.slug === data.brand.slug)));
      setNotice(payload.active ? "Бренд опубликован: страница, ссылки и sitemap обновлены автоматически." : "Черновик сохранён. Включите публикацию, когда страница будет готова.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Ошибка сохранения"); }
    finally { setSaving(false); }
  };
  const upload = async (file?: File) => {
    if (!file) return; setSaving(true); setError("");
    try { const form = new FormData(); form.append("file", file); const data = await responseData(await fetch("/api/admin/uploads", { method: "POST", body: form })); change("logo", data.url); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Ошибка загрузки"); }
    finally { setSaving(false); }
  };

  return <div className="min-w-0 space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h1 className="text-2xl font-semibold">Бренды и страницы брендов</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">Логотип, описание, товары и SEO настраиваются вместе. Опубликованный бренд получает страницу /brands/адрес, ссылку на главной и запись в sitemap. Новые товары из МойСклад также попадают в sitemap автоматически после синхронизации.</p>
      <button type="button" disabled={saving} onClick={() => { setEditor(emptyBrand(Math.max(0, ...brands.map(brand => brand.sortOrder)) + 1)); setEditingSlug(null); setProductQuery(""); setError(""); setNotice(""); }} className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white">+ Создать бренд</button>
      <div className="mt-4 divide-y divide-slate-100">
        {brands.map(brand => <div key={brand.slug} className="flex flex-wrap items-center gap-3 py-3">
          <img src={brand.logo} alt="" className="h-12 w-20 rounded bg-stone-50 object-contain" />
          <div className="min-w-0 flex-1"><p className="font-medium">{brand.name}</p><p className="break-all text-xs text-slate-500">/brands/{brand.slug} · {brand.active ? "Опубликован" : "Черновик"}</p></div>
          <button type="button" disabled={saving} onClick={() => edit(brand)} className="rounded-lg border px-3 py-2 text-sm">Редактировать</button>
          {brand.active && <Link href={`/brands/${brand.slug}`} prefetch={false} target="_blank" className="text-sm font-medium text-amber-700">Открыть ↗</Link>}
        </div>)}
      </div>
    </section>
    {editor && <form onSubmit={save} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5" aria-label="Конструктор бренда">
      <h2 className="text-xl font-semibold">{editingSlug ? `Редактирование: ${editor.name}` : "Новый бренд"}</h2>
      <fieldset disabled={saving} className="space-y-5 disabled:opacity-60">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Название<input required maxLength={160} className={inputClass} value={editor.name} onChange={e => change("name", e.target.value)} /></label>
          <label className="text-sm">Адрес страницы<input className={inputClass} disabled={Boolean(editingSlug)} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} value={editor.slug} placeholder={brandSlug(editor.name) || "brand-name"} onChange={e => change("slug", e.target.value)} /><span className="mt-1 block text-xs text-slate-500">/brands/{editor.slug || brandSlug(editor.name)} · Латиница и дефисы. После создания адрес сохраняется.</span></label>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {editor.logo && <img src={editor.logo} alt="Предпросмотр логотипа" className="h-20 w-36 rounded-lg border object-contain" />}
          <label className="text-sm">Загрузить логотип<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="mt-2 block max-w-full text-sm" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} /><span className="mt-1 block text-xs text-slate-500">Рекомендуем 600 × 300 px, JPG/PNG/WEBP/GIF, до 8 МБ.</span></label>
        </div>
        <label className="block text-sm">Путь к логотипу<input required className={inputClass} value={editor.logo} placeholder="/uploads/...webp" onChange={e => change("logo", e.target.value)} /></label>
        {BRANDS.some(brand => brand.slug === editingSlug) && <button type="button" className="text-sm font-medium text-amber-700" onClick={() => change("logo", BRANDS.find(brand => brand.slug === editingSlug)!.logo)}>Вернуть исходный логотип</button>}
        <label className="block text-sm">Краткий текст под названием<input maxLength={400} className={inputClass} value={editor.tagline} onChange={e => change("tagline", e.target.value)} /></label>
        <label className="block text-sm">О бренде<textarea rows={7} className={inputClass} value={editor.description} onChange={e => change("description", e.target.value)} /><span className="mt-1 block text-xs text-slate-500">Разделяйте абзацы пустой строкой. Текст сохраняется без HTML.</span></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Категории товаров<textarea rows={4} className={inputClass} value={editor.categories} onChange={e => change("categories", e.target.value)} /><span className="text-xs text-slate-500">Каждая категория с новой строки.</span></label>
          <label className="text-sm">Преимущества<textarea rows={4} className={inputClass} value={editor.advantages} onChange={e => change("advantages", e.target.value)} /><span className="text-xs text-slate-500">Каждое преимущество с новой строки.</span></label>
        </div>
        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold">Товары бренда</h3>
          <label className="block text-sm">Поисковое слово в каталоге<input maxLength={200} className={inputClass} value={editor.searchTerm} placeholder={editor.name || "Например: Edon или FBH"} onChange={e => change("searchTerm", e.target.value)} /></label>
          <p className="text-xs leading-relaxed text-slate-500">Кнопка «Смотреть товары» откроет каталог с этим запросом. Без ручной подборки на странице появятся первые 8 товаров по запросу, в том числе новые после синхронизации. Если запрос пустой, кнопка ведёт в общий каталог.</p>
          <h4 className="text-sm font-medium">Ручная подборка: {editor.productIds.length} из 24</h4>
          <p className="text-xs text-slate-500">Необязательно. Выбранные товары заменят автоматическую подборку на странице бренда.</p>
          {editor.productIds.map(id => <div key={id} className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 p-2 text-sm"><span>{knownProducts[id]?.name ?? `Товар ${id}`}</span><button type="button" aria-label={`Убрать ${knownProducts[id]?.name ?? id}`} onClick={() => change("productIds", editor.productIds.filter(value => value !== id))} className="shrink-0 px-2 py-1 text-red-600">Убрать</button></div>)}
          <label className="block text-sm">Найти товар для подборки<input className={inputClass} value={productQuery} placeholder="Название, код или артикул" onChange={e => setProductQuery(e.target.value)} /></label>
          {productLoading && <p role="status" className="text-sm text-slate-500">Поиск товаров…</p>}
          {productError && <p role="alert" className="text-sm text-red-600">{productError}</p>}
          <div className="max-h-64 space-y-1 overflow-y-auto">{products.map(product => <label key={product.id} className="flex cursor-pointer items-start gap-2 rounded p-2 text-sm hover:bg-stone-50"><input type="checkbox" className="mt-1" checked={editor.productIds.includes(product.id)} disabled={!editor.productIds.includes(product.id) && editor.productIds.length >= 24} onChange={e => change("productIds", e.target.checked ? [...editor.productIds, product.id] : editor.productIds.filter(id => id !== product.id))} /><span>{product.name}<span className="block text-xs text-slate-500">{product.code && `Код: ${product.code}`} {product.article && ` · Арт: ${product.article}`}</span></span></label>)}</div>
        </section>
        <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-medium">SEO — заполняется автоматически, можно изменить</summary>
          <label className="mt-3 block text-sm">SEO-заголовок<input maxLength={200} className={inputClass} value={editor.seoTitle} placeholder={`${editor.name} — купить в ДомСтрой`} onChange={e => change("seoTitle", e.target.value)} /></label>
          <label className="mt-3 block text-sm">SEO-описание<textarea maxLength={400} rows={3} className={inputClass} value={editor.seoDescription} placeholder="По умолчанию — краткий текст и первый абзац описания" onChange={e => change("seoDescription", e.target.value)} /></label>
          <p className="mt-2 text-xs text-slate-500">Canonical, Open Graph, разметка Brand и запись в sitemap формируются при публикации. Поисковики сами определяют сроки индексации.</p>
        </details>
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={editor.active} onChange={e => change("active", e.target.checked)} />Опубликовать страницу</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={editor.showOnHome} onChange={e => change("showOnHome", e.target.checked)} />Показывать на главной</label>
          <label>Порядок<input type="number" min={0} max={10000} className={`${inputClass} max-w-24`} value={editor.sortOrder} onChange={e => change("sortOrder", Number(e.target.value))} /></label>
        </div>
      </fieldset>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
      <button type="submit" disabled={saving} className="rounded-lg bg-amber-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Сохранение…" : "Сохранить бренд и страницу"}</button>
    </form>}
  </div>;
}
