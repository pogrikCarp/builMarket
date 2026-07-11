"use client";

import { useEffect, useState } from "react";

type Redirect = {
  id: string;
  fromPath: string;
  toPath: string;
  type: "PERMANENT" | "TEMPORARY";
  active: boolean;
};

const EMPTY_FORM = { fromPath: "", toPath: "", type: "PERMANENT" as "PERMANENT" | "TEMPORARY" };

export function RedirectsManager() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/redirects");
      const data = await res.json();
      setRedirects(data.redirects ?? []);
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
      const res = await fetch("/api/admin/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка создания");
      setRedirects((prev) => [data.redirect, ...prev]);
      setForm(EMPTY_FORM);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (r: Redirect) => {
    const res = await fetch(`/api/admin/redirects/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !r.active }),
    });
    if (res.ok) {
      setRedirects((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: !r.active } : x)));
    }
  };

  const remove = async (r: Redirect) => {
    if (!confirm(`Удалить редирект ${r.fromPath} → ${r.toPath}?`)) return;
    const res = await fetch(`/api/admin/redirects/${r.id}`, { method: "DELETE" });
    if (res.ok) {
      setRedirects((prev) => prev.filter((x) => x.id !== r.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">SEO — редиректы</h1>
        <p className="mt-1 text-sm text-slate-500">
          Настройка 301/302 переадресаций. Применяются на уровне сервера (Proxy) для всех запросов.
          Мета-теги и ЧПУ для статичных страниц — в разделе «Страницы».
        </p>

        <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            required
            placeholder="Откуда, напр. /old-page"
            value={form.fromPath}
            onChange={(e) => setForm((f) => ({ ...f, fromPath: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
          />
          <input
            required
            placeholder="Куда, напр. /catalog"
            value={form.toPath}
            onChange={(e) => setForm((f) => ({ ...f, toPath: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
          />
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "PERMANENT" | "TEMPORARY" }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
          >
            <option value="PERMANENT">301 (постоянный)</option>
            <option value="TEMPORARY">302 (временный)</option>
          </select>
          {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="col-span-full rounded-lg bg-slate-950 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500 hover:text-white disabled:opacity-60"
          >
            {saving ? "Сохранение..." : "Добавить редирект"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-400">Загрузка...</p>
        ) : redirects.length === 0 ? (
          <p className="text-sm text-slate-400">Редиректов пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4">Откуда</th>
                  <th className="py-2 pr-4">Куда</th>
                  <th className="py-2 pr-4">Тип</th>
                  <th className="py-2 pr-4">Активен</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {redirects.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-900">{r.fromPath}</td>
                    <td className="py-3 pr-4 text-slate-500">{r.toPath}</td>
                    <td className="py-3 pr-4">{r.type === "PERMANENT" ? "301" : "302"}</td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(r)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          r.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {r.active ? "Да" : "Нет"}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => remove(r)}
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
