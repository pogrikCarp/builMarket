"use client";

import { useEffect, useMemo, useState } from "react";

type MediaType = "HERO" | "LOOKBOOK" | "CERTIFICATE" | "BRAND";
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

type Slot = {
  type: MediaType;
  sortOrder: number;
  title: string;
  description: string;
};

const HERO_SLOTS: Slot[] = [0, 1, 2, 3].map((sortOrder) => ({
  type: "HERO",
  sortOrder,
  title: `Главный баннер ${sortOrder + 1}`,
  description: "Изображение слайда главного баннера",
}));

const LOOKBOOK_SLOTS: Slot[] = [0, 1, 2, 3].map((sortOrder) => ({
  type: "LOOKBOOK",
  sortOrder,
  title: `Набор ${sortOrder + 1}`,
  description: "Изображение карточки набора на главной",
}));

const MEDIA_SECTIONS: { type: MediaType; title: string; description: string }[] = [
  { type: "CERTIFICATE", title: "Сертификаты", description: "Добавляйте сертификаты с изображениями" },
  { type: "BRAND", title: "Бренды", description: "Добавляйте бренды с логотипами" },
];

export function BannersManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/banners")
      .then(async (res) => {
        if (!res.ok) throw new Error("Ошибка загрузки контента");
        return res.json();
      })
      .then((data) => {
        if (mounted) setBanners(data.banners ?? []);
      })
      .catch((reason) => {
        if (mounted) setError(reason instanceof Error ? reason.message : "Ошибка загрузки");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const findBanner = (type: MediaType, sortOrder: number) =>
    banners.find((banner) => banner.type === type && banner.sortOrder === sortOrder);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Ошибка загрузки изображения");
    return data.url as string;
  };

  const saveImage = async (slot: Slot, file: File) => {
    const key = `${slot.type}-${slot.sortOrder}`;
    setSavingKey(key);
    setError(null);
    try {
      const image = await uploadImage(file);
      const existing = findBanner(slot.type, slot.sortOrder);
      const response = await fetch(existing ? `/api/admin/banners/${existing.id}` : "/api/admin/banners", {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: slot.type,
          title: existing?.title || slot.title,
          subtitle: existing?.subtitle,
          image,
          link: existing?.link,
          active: true,
          sortOrder: slot.sortOrder,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Ошибка сохранения");
      setBanners((current) => {
        const withoutCurrent = current.filter((banner) => banner.id !== data.banner.id);
        return [...withoutCurrent, data.banner].sort((a, b) => a.sortOrder - b.sortOrder);
      });
      setPendingFiles((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ошибка сохранения");
    } finally {
      setSavingKey(null);
    }
  };

  const addMedia = async (type: MediaType, file: File) => {
    const current = banners.filter((banner) => banner.type === type);
    const fallbackCount = type === "CERTIFICATE" ? 6 : 10;
    const sortOrder = current.length ? Math.max(...current.map((banner) => banner.sortOrder)) + 1 : fallbackCount;
    await saveImage({ type, sortOrder, title: `${type === "CERTIFICATE" ? "Сертификат" : "Бренд"} ${sortOrder + 1}`, description: "" }, file);
  };

  const remove = async (banner: Banner) => {
    if (!confirm(`Удалить «${banner.title}»?`)) return;
    const response = await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" });
    if (response.ok) setBanners((current) => current.filter((item) => item.id !== banner.id));
  };

  const legacyBanners = useMemo(
    () => banners.filter((banner) => banner.type === "BANNER" || banner.type === "PROMO"),
    [banners]
  );

  const renderSlot = (slot: Slot) => {
    const banner = findBanner(slot.type, slot.sortOrder);
    const key = `${slot.type}-${slot.sortOrder}`;
    return (
      <div key={key} className="space-y-2">
        <label className="group relative flex min-h-48 cursor-pointer flex-col overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-amber-400">
          {banner?.image ? <img src={banner.image} alt={banner.title} className="absolute inset-0 h-full w-full object-cover" /> : null}
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center ${banner?.image ? "bg-black/45 text-white" : "text-slate-500"}`}>
            <span className="text-4xl font-light">+</span>
            <span className="mt-2 text-sm font-semibold">{banner?.title || slot.title}</span>
            <span className="mt-1 text-xs opacity-80">{slot.description}</span>
            {banner?.image && <span className="mt-3 rounded-full bg-white/20 px-3 py-1 text-[11px]">Выбрать замену</span>}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={savingKey === key}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setPendingFiles((current) => ({ ...current, [key]: file }));
            }}
          />
        </label>
        <button
          type="button"
          disabled={!pendingFiles[key] || savingKey === key}
          onClick={() => pendingFiles[key] && saveImage(slot, pendingFiles[key])}
          className="w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          {savingKey === key ? "Сохранение..." : pendingFiles[key] ? "Сохранить" : "Выберите изображение"}
        </button>
      </div>
    );
  };

  const renderCollection = (type: MediaType, title: string, description: string) => {
    const items = banners.filter((banner) => banner.type === type).sort((a, b) => a.sortOrder - b.sortOrder);
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500">
            <span>+ Добавить</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => event.target.files?.[0] && addMedia(type, event.target.files[0])} />
          </label>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((banner) => (
            <div key={banner.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="relative aspect-[4/3]">
                {banner.image && <img src={banner.image} alt={banner.title} className="h-full w-full object-contain" />}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white p-3">
                <span className="truncate text-xs font-semibold text-slate-700">{banner.title}</span>
                <button type="button" onClick={() => remove(banner)} className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-800">Удалить</button>
              </div>
            </div>
          ))}
          {!items.length && <p className="text-sm text-slate-400">Пока ничего не добавлено</p>}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Баннеры</h1>
        <p className="mt-2 text-sm text-slate-500">Загрузите изображение в нужный блок и оно сразу станет активным на главной странице.</p>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      </section>

      {loading ? (
        <p className="text-sm text-slate-400">Загрузка...</p>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Главный баннер</h2>
            <p className="mt-1 text-sm text-slate-500">Четыре блока соответствуют четырём слайдам главного баннера.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{HERO_SLOTS.map(renderSlot)}</div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Карточки наборов</h2>
            <p className="mt-1 text-sm text-slate-500">Четыре блока соответствуют четырём карточкам наборов на главной.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{LOOKBOOK_SLOTS.map(renderSlot)}</div>
          </section>

          {MEDIA_SECTIONS.map((section) => renderCollection(section.type, section.title, section.description))}

          {legacyBanners.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Старые баннеры и акции</h2>
              <div className="mt-4 space-y-2">
                {legacyBanners.map((banner) => (
                  <div key={banner.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-700">{banner.title}</span>
                    <button type="button" onClick={() => remove(banner)} className="text-xs font-semibold text-red-600 hover:text-red-800">Удалить</button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
