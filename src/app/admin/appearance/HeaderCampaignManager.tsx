"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CampaignRibbon from "@/components/layout/CampaignRibbon";
import { EMPTY_HEADER_CAMPAIGN, HEADER_THEMES, resolveHeaderTheme, type HeaderCampaign, type HeaderThemeKey } from "@/lib/header-campaign";

async function readResponse(response: Response) {
  const data = await response.json().catch(() => null);
  if (response.status === 403) throw new Error("Войдите в админ-панель заново");
  if (!response.ok || !data) throw new Error(data?.error || "Не удалось выполнить запрос. Повторите попытку.");
  return data;
}

export default function HeaderCampaignManager() {
  const [draft, setDraft] = useState<HeaderCampaign>(EMPTY_HEADER_CAMPAIGN);
  const [hasPromos, setHasPromos] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingFile, setCheckingFile] = useState(false);
  const [pending, setPending] = useState<{ file: File; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const previewUrl = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/header-campaign", { cache: "no-store" }).then(readResponse).then((data) => {
      if (mounted) { setDraft(data.campaign); setHasPromos(data.hasPromos); setLoaded(true); }
    }).catch((reason) => { if (mounted) setError(reason instanceof Error ? reason.message : "Ошибка загрузки"); });
    return () => { mounted = false; if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); };
  }, []);

  const selectTheme = (theme: HeaderThemeKey) => {
    setDraft((current) => ({ ...current, theme, buttonLabel: "" }));
    setNotice(null);
  };

  const chooseFile = async (file: File) => {
    setError(null);
    setNotice(null);
    if (!["image/png", "image/webp", "image/jpeg"].includes(file.type) || file.size > 8 * 1024 * 1024 || file.size === 0) {
      setError("Выберите PNG, WEBP или JPG до 8 МБ");
      return;
    }
    setCheckingFile(true);
    try {
      const bitmap = await createImageBitmap(file);
      const valid = bitmap.width >= 480 && bitmap.height >= 120 && Math.abs(bitmap.width / bitmap.height - 4) <= 0.04;
      bitmap.close();
      if (!valid) throw new Error("Нужна наклейка с пропорциями 4:1, минимум 480×120 px. Рекомендуем 960×240 px.");
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      const url = URL.createObjectURL(file);
      previewUrl.current = url;
      setPending({ file, url });
      setDraft((current) => ({ ...current, theme: "custom" }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось прочитать изображение");
    } finally { setCheckingFile(false); }
  };

  const save = async () => {
    if (saving || checkingFile) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      let customImage = draft.customImage;
      if (pending) {
        const form = new FormData();
        form.append("file", pending.file);
        customImage = (await readResponse(await fetch("/api/admin/uploads", { method: "POST", body: form }))).url;
      }
      const data = await readResponse(await fetch("/api/admin/header-campaign", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, customImage }),
      }));
      setDraft(data.campaign);
      setHasPromos(data.hasPromos);
      setPending(null);
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
      setNotice("Оформление сохранено. Обновите страницу сайта, чтобы увидеть изменения.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ошибка сохранения");
    } finally { setSaving(false); }
  };

  const preview = { ...draft, customImage: pending?.url || draft.customImage };
  const selected = resolveHeaderTheme(preview);
  const disabled = !loaded || saving || checkingFile;

  return <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Оформление шапки</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Тематическая наклейка появится в верхней плашке на главной, в каталоге и на страницах с общей шапкой. Каталог, поиск, корзина и личный кабинет остаются доступны.</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">{notice}</p>}
      {!loaded && !error && <p className="mt-4 text-sm text-slate-500">Загрузка...</p>}
    </section>

    {loaded && <>
      <fieldset disabled={disabled} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <legend className="px-2 text-lg font-semibold text-slate-900">Готовые наклейки</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {HEADER_THEMES.map((theme) => <label key={theme.key} className={`cursor-pointer rounded-xl border-2 p-4 transition ${draft.theme === theme.key ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:border-amber-300"}`}>
            <div className="relative mb-3 h-20 rounded-lg" style={{ backgroundColor: theme.background }}><Image src={theme.image} alt="" aria-hidden="true" fill sizes="320px" unoptimized className="object-contain p-2" /></div>
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800"><input type="radio" name="theme" value={theme.key} checked={draft.theme === theme.key} onChange={() => selectTheme(theme.key)} className="accent-amber-600" />{theme.name}</span>
          </label>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-5 text-sm text-slate-700">
          <label className="flex items-center gap-2"><input type="radio" name="theme" value="none" checked={draft.theme === "none"} onChange={() => selectTheme("none")} className="accent-amber-600" />Без оформления</label>
          <label className="flex items-center gap-2"><input type="radio" name="theme" value="custom" checked={draft.theme === "custom"} onChange={() => selectTheme("custom")} className="accent-amber-600" />Своя наклейка</label>
        </div>
      </fieldset>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Своя наклейка</h2>
        <p id="sticker-size" className="mt-2 text-sm leading-6 text-slate-600"><strong>Рекомендуемый размер: 960×240 px.</strong> Пропорции 4:1, минимум 480×120 px. PNG или WEBP с прозрачным фоном, также можно JPG. До 8 МБ. На сайте наклейка отображается в рамке 144×36 px без обрезки.</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">Используйте крупный текст и оставьте немного свободного места по краям. Готовые наклейки сохраняются при загрузке своей; загруженный файл тоже остаётся доступен при переключении на готовую тему.</p>
        <label className="mt-4 block text-sm font-semibold text-slate-700">Изображение наклейки
          <input type="file" accept="image/png,image/webp,image/jpeg" disabled={disabled} aria-describedby="sticker-size" className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:font-semibold" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void chooseFile(file);
            event.target.value = "";
          }} />
        </label>
        {pending && <p className="mt-2 break-all text-xs text-slate-600">Выбрано: {pending.file.name}</p>}
        {(pending || draft.customImage) && <div className="relative mt-4 h-20 w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50"><Image src={pending?.url || draft.customImage!} alt="Ваша сохранённая наклейка" fill unoptimized className="object-contain p-2" /></div>}
        <label className="mt-4 block text-sm font-semibold text-slate-700">Название своей наклейки
          <input value={draft.customTitle} onChange={(event) => setDraft((current) => ({ ...current, customTitle: event.target.value }))} disabled={disabled} maxLength={60} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Кнопка акций</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Ведёт в каталог с акционными товарами. Появляется только вместе с наклейкой и при наличии активных товаров в разделе <Link href="/admin/promo" className="font-semibold text-amber-700 underline">«Акции»</Link>. Если акции отключены или их товары удалены, кнопка скрывается автоматически.</p>
        <label className="mt-4 block text-sm font-semibold text-slate-700">Текст кнопки (необязательно)
          <input value={draft.buttonLabel} onChange={(event) => setDraft((current) => ({ ...current, buttonLabel: event.target.value }))} disabled={disabled} placeholder={selected?.buttonLabel || "Смотреть акции"} maxLength={32} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
        </label>
        <p className="mt-2 text-xs text-slate-500">Оставьте пустым, чтобы использовать тематический текст готовой наклейки.</p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="px-6 pt-5 text-lg font-semibold text-slate-900">Предпросмотр</h2>
        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 px-4 py-4 text-sm text-slate-700"><span className="font-bold">ДомСтрой</span><span>☰ Каталог</span><span className="ml-auto hidden text-slate-400 sm:inline">Поиск · Корзина</span></div>
        {selected ? <CampaignRibbon campaign={preview} hasPromos preview /> : <p className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">{draft.theme === "custom" ? "Загрузите наклейку, чтобы увидеть предпросмотр." : "Обычная шапка без наклейки и кнопки акций."}</p>}
        <p className="border-t border-slate-100 px-6 py-4 text-xs leading-5 text-slate-500">{hasPromos ? "Активные акции есть — кнопка будет показана на сайте." : "Кнопка в предпросмотре показана как пример. Сейчас активных акций нет — на сайте она будет скрыта."}</p>
      </section>
      <button type="button" onClick={() => void save()} disabled={disabled || (draft.theme === "custom" && !preview.customImage)} className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300">{saving ? "Сохранение..." : checkingFile ? "Проверка изображения..." : "Сохранить оформление"}</button>
    </>}
  </div>;
}
