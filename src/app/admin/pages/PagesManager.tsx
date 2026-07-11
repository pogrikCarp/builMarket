"use client";

import { useEffect, useState } from "react";

type StaticPage = {
  id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

const EMPTY_FORM = { slug: "", title: "", content: "", seoTitle: "", seoDescription: "" };

export function PagesManager() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pages");
      const data = await res.json();
      setPages(data.pages ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (p: StaticPage) => {
    setEditingId(p.id);
    setForm({
      slug: p.slug,
      title: p.title,
      content: p.content,
      seoTitle: p.seoTitle ?? "",
      seoDescription: p.seoDescription ?? "",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/pages/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка сохранения");
        setPages((prev) => prev.map((p) => (p.id === editingId ? data.page : p)));
      } else {
        const res = await fetch("/api/admin/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ошибка создания");
        setPages((prev) => [data.page, ...prev]);
      }
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (p: StaticPage) => {
    const res = await fetch(`/api/admin/pages/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !p.published }),
    });
    if (res.ok) {
      setPages((prev) => prev.map((x) => (x.id === p.id ? { ...x, published: !p.published } : x)));
    }
  };

  const remove = async (p: StaticPage) => {
    if (!confirm(`Удалить страницу "${p.title}"?`)) return;
    const res = await fetch(`/api/admin/pages/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      setPages((prev) => prev.filter((x) => x.id !== p.id));
      if (editingId === p.id) resetForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          {editingId ? "Редактирование страницы" : "Новая статичная страница"}
        </h1>

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              required
              disabled={!!editingId}
              placeholder="ЧПУ-адрес (slug), напр. delivery"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400 disabled:bg-slate-50"
            />
            <input
              required
              placeholder="Заголовок *"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <textarea
            placeholder="Контент страницы (HTML/текст)"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={6}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              placeholder="SEO Title"
              value={form.seoTitle}
              onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
            />
            <input
              placeholder="SEO Description"
              value={form.seoDescription}
              onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-950 px-6 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500 hover:text-white disabled:opacity-60"
            >
              {saving ? "Сохранение..." : editingId ? "Сохранить" : "Создать"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400"
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-400">Загрузка...</p>
        ) : pages.length === 0 ? (
          <p className="text-sm text-slate-400">Страниц пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4">Slug</th>
                  <th className="py-2 pr-4">Заголовок</th>
                  <th className="py-2 pr-4">Опубликована</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 text-slate-500">/{p.slug}</td>
                    <td className="py-3 pr-4 font-medium text-slate-900">{p.title}</td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => togglePublished(p)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          p.published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {p.published ? "Да" : "Нет"}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-600"
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(p)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Удалить
                        </button>
                      </div>
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
