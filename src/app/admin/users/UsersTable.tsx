"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  _count: { orders: number };
};

export function UsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Ошибка загрузки пользователей");
      const data = await res.json();
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRole = async (u: UserRow) => {
    const newRole = u.role === "ADMIN" ? "USER" : "ADMIN";
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (u: UserRow) => {
    if (!confirm(`Удалить пользователя ${u.email}? Действие необратимо.`)) return;
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Пользователи</h1>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-sm text-slate-400">Загрузка...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Клиент</th>
                <th className="py-2 pr-4">Контакты</th>
                <th className="py-2 pr-4">Заказов</th>
                <th className="py-2 pr-4">Роль</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-slate-900">{u.name || "—"}</div>
                    <div className="text-xs text-slate-400">
                      с {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="text-slate-900">{u.email}</div>
                    <div className="text-xs text-slate-400">{u.phone || ""}</div>
                  </td>
                  <td className="py-3 pr-4">{u._count.orders}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        u.role === "ADMIN" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.role === "ADMIN" ? "Админ" : "Клиент"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => toggleRole(u)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-600 disabled:opacity-50"
                      >
                        {u.role === "ADMIN" ? "Забрать админку" : "Сделать админом"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => removeUser(u)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
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
  );
}
