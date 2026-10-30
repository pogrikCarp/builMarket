"use client";
/* eslint-disable @next/next/no-img-element -- Admin previews show the uploaded file without optimization. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_MEDIA, getDefaultMedia, type MediaType } from "@/lib/default-media";

type Banner = {
  id: string;
  type: "BANNER" | "PROMO" | MediaType;
  title: string;
  subtitle: string | null;
  image: string | null;
  link: string | null;
  active: boolean;
  sortOrder: number;
};

type Slot = { type: MediaType; sortOrder: number; title: string; image?: string };
const SECTIONS: { type: MediaType; title: string; description: string }[] = [
  { type: "HERO", title: "Главный баннер", description: "Четыре слайда главного баннера, слева направо. На телефоне загруженное изображение показывается целиком, без стандартных надписей поверх него." },
  { type: "LOOKBOOK", title: "Карточки наборов", description: "Четыре карточки наборов на главной странице." },
  { type: "CERTIFICATE", title: "Сертификаты", description: "Сертификаты на главной и странице сертификатов." },
];

async function readResponse(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = response.status === 413 ? "Размер файла не должен превышать 8 МБ"
      : response.status === 403 ? "Сессия истекла. Войдите в админ-панель заново."
      : `Не удалось выполнить запрос (${response.status}). Повторите попытку.`;
    throw new Error(data?.error || message);
  }
  if (!data) throw new Error("Сервер вернул некорректный ответ. Повторите попытку.");
  return data;
}

export function BannersManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/banners", { cache: "no-store" })
      .then(readResponse)
      .then((data) => {
        if (mounted) {
          setBanners(data.banners ?? []);
          setLoaded(true);
        }
      })
      .catch((reason) => {
        if (mounted) setError(reason instanceof Error ? reason.message : "Ошибка загрузки");
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const findBanner = (slot: Slot) => banners.find((banner) => banner.type === slot.type && banner.sortOrder === slot.sortOrder);
  const clearPending = (key: string) => setPendingFiles((current) => {
    const next = { ...current };
    delete next[key];
    return next;
  });

  const saveImage = async (slot: Slot, file: File) => {
    if (savingKey) return;
    const key = `${slot.type}-${slot.sortOrder}`;
    setSavingKey(key);
    setError(null);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const upload = await readResponse(await fetch("/api/admin/uploads", { method: "POST", body: formData }));
      const existing = findBanner(slot);
      const data = await readResponse(await fetch(existing ? `/api/admin/banners/${existing.id}` : "/api/admin/banners", {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: slot.type, title: existing?.title || slot.title,
          subtitle: existing?.subtitle, image: upload.url, link: existing?.link,
          active: true, sortOrder: slot.sortOrder, startsAt: null, endsAt: null,
        }),
      }));
      setBanners((current) => [data.banner, ...current.filter((banner) => banner.id !== data.banner.id)]);
      clearPending(key);
      setNotice("Изображение сохранено. Оно появится на сайте после обновления страницы.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ошибка сохранения");
    } finally {
      setSavingKey(null);
    }
  };

  const addMedia = async (type: MediaType, file: File) => {
    const orders = [...DEFAULT_MEDIA, ...banners].filter((item) => item.type === type).map((item) => item.sortOrder);
    const sortOrder = Math.max(-1, ...orders) + 1;
    await saveImage({ type, sortOrder, title: `${type === "CERTIFICATE" ? "Сертификат" : "Бренд"} ${sortOrder + 1}` }, file);
  };

  const remove = async (banner: Banner) => {
    if (savingKey) return;
    const original = getDefaultMedia(banner.type, banner.sortOrder);
    if (!original && !confirm(`Удалить «${banner.title}»?`)) return;
    const key = `${banner.type}-${banner.sortOrder}`;
    setSavingKey(key);
    setError(null);
    setNotice(null);
    try {
      await readResponse(await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" }));
      setBanners((current) => current.filter((item) => original
        ? item.type !== banner.type || item.sortOrder !== banner.sortOrder
        : item.id !== banner.id));
      clearPending(key);
      setNotice(original ? "Изображение по умолчанию возвращено." : "Изображение удалено.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ошибка удаления");
    } finally {
      setSavingKey(null);
    }
  };

  const renderSlot = (slot: Slot) => {
    const banner = findBanner(slot);
    const key = `${slot.type}-${slot.sortOrder}`;
    const hasOverride = Boolean(banner?.image && banner.image !== slot.image);
    const image = banner?.active && banner.image ? banner.image : slot.image;
    return (
      <div key={key} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-900">{slot.title}</p>
        <label className="group relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-white transition hover:border-amber-400">
          {image && <img key={image} src={image} alt={slot.title} className="h-full w-full object-contain" onError={(event) => {
            if (slot.image && event.currentTarget.getAttribute("src") !== slot.image) event.currentTarget.src = slot.image;
          }} />}
          <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-2 text-center text-xs font-semibold text-white">Выбрать замену</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={savingKey !== null}
            aria-label={`Выбрать изображение: ${slot.title}`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setPendingFiles((current) => ({ ...current, [key]: file }));
              event.target.value = "";
            }} />
        </label>
        <p className="text-xs text-slate-500">{hasOverride ? "Сохранена замена" : "Используется изображение по умолчанию"}</p>
        {pendingFiles[key] && <p className="break-all text-xs text-slate-700">Выбрано: {pendingFiles[key].name}</p>}
        <button type="button" disabled={!pendingFiles[key] || savingKey !== null}
          onClick={() => pendingFiles[key] && saveImage(slot, pendingFiles[key])}
          className="w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
          {savingKey === key ? "Сохранение..." : "Сохранить замену"}
        </button>
        {slot.image && <div className="space-y-2 border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold text-slate-600">По умолчанию</p>
          <img src={slot.image} alt={`По умолчанию: ${slot.title}`} className="h-20 w-full rounded-lg bg-white object-contain" />
          <button type="button" disabled={!banner || savingKey !== null} onClick={() => banner && remove(banner)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-40">
            Вернуть по умолчанию
          </button>
        </div>}
        {!slot.image && banner && <button type="button" disabled={savingKey !== null} onClick={() => remove(banner)} className="text-xs font-semibold text-red-600 disabled:opacity-40">Удалить</button>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Баннеры</h1>
        <p className="mt-2 text-sm text-slate-500">Новые изображения заменяют стандартные на сайте. Оригиналы всегда доступны ниже: их можно вернуть кнопкой «Вернуть по умолчанию».</p>
        <p className="mt-2 text-xs text-slate-500">JPG, PNG, WEBP или GIF, до 8 МБ.</p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</p>}
      </section>
      {loading && <p className="text-sm text-slate-400">Загрузка...</p>}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Бренды</h2>
        <p className="mt-2 text-sm text-slate-500">Логотипы и страницы брендов теперь редактируются вместе в конструкторе брендов. Все прежние логотипы сохранены.</p>
        <Link href="/admin/brands" className="mt-4 inline-flex rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white">Открыть конструктор брендов →</Link>
      </section>
      {loaded && SECTIONS.map((section) => {
        const defaults = DEFAULT_MEDIA.filter((item) => item.type === section.type);
        const extras = banners.filter((item) => item.type === section.type && !getDefaultMedia(item.type, item.sortOrder));
        return <section key={section.type} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{section.description}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {defaults.map(renderSlot)}
            {extras.map((item) => renderSlot({ type: section.type, sortOrder: item.sortOrder, title: item.title }))}
          </div>
          {(section.type === "CERTIFICATE" || section.type === "BRAND") && <label className="mt-5 inline-flex cursor-pointer rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-amber-100">
            + Добавить
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={savingKey !== null}
              aria-label={`Добавить: ${section.title}`} onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void addMedia(section.type, file);
                event.target.value = "";
              }} />
          </label>}
        </section>;
      })}
      {loaded && banners.some((item) => item.type === "BANNER" || item.type === "PROMO") && <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Старые баннеры и акции</h2>
        {banners.filter((item) => item.type === "BANNER" || item.type === "PROMO").map((banner) => <div key={banner.id} className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm text-slate-700">{banner.title}</span>
          <button type="button" disabled={savingKey !== null} onClick={() => remove(banner)} className="text-xs font-semibold text-red-600">Удалить</button>
        </div>)}
      </section>}
    </div>
  );
}
