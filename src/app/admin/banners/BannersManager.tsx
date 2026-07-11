"use client";

import { useEffect, useState } from "react";

type Banner = {
  id: string;
  type: "BANNER" | "PROMO";
  title: string;
  subtitle: string | null;
  image: string | null;
  link: string | null;
  active: boolean;
  sortOrder: number;
};

const EMPTY_FORM = {
  type: "BANNER" as "BANNER" | "PROMO",
  title: "",
  subtitle: "",
  image: "",
  link: "",
  active: true,
  sortOrder: 0,
};

export function BannersManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      const data = await res.json();
      setBanners(data.banners ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка создания");
      setBanners((prev) => [...prev, data.banner]);
      setForm(EMPTY_FORM);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b: Banner) => {
    const res = await fetch(`/api/admin/banners/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !b.active }),
    });
    if (res.ok) {
      setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, active: !b.active } : x)));
    }
  };

  const remove = async (b: Banner) => {
    if (!confirm(`Удалить "${b.title}"?`)) return;
    const res = await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" });
    if (res.ok) {
      setBanners((prev) => prev.filter((x) => x.id !== b.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Баннеры и акции</h1>

        <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "BANNER" | "PROMO" }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
          >
            <option value="BANNER">Баннер</option>
            <option value="PROMO">Акция</option>
          </select>
          <input
            required
            placeholder="Название *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
          />
          <input
            placeholder="Подзаголовок"
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
          />
          <input
            placeholder="Ссылка на картинку (/banner1.jpg)"
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
          />
          <input
            placeholder="Ссылка при клике (/catalog)"
            value={form.link}
            onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
          />
          <input
            type="number"
            placeholder="Порядок сортировки"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
          />
          {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="col-span-full rounded-lg bg-slate-950 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500 hover:text-white disabled:opacity-60"
          >
            {saving ? "Сохранение..." : "Добавить"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-400">Загрузка...</p>
        ) : banners.length === 0 ? (
          <p className="text-sm text-slate-400">Баннеров и акций пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4">Тип</th>
                  <th className="py-2 pr-4">Название</th>
                  <th className="py-2 pr-4">Ссылка</th>
                  <th className="py-2 pr-4">Активен</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {banners.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">{b.type === "PROMO" ? "Акция" : "Баннер"}</td>
                    <td className="py-3 pr-4 font-medium text-slate-900">{b.title}</td>
                    <td className="py-3 pr-4 text-slate-500">{b.link || "—"}</td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(b)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          b.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {b.active ? "Да" : "Нет"}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => remove(b)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
