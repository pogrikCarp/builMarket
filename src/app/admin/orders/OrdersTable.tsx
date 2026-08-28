"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  number: string;
  status: string;
  total: string;
  createdAt: string;
  user: { name: string | null; email: string; phone: string | null } | null;
  customerName: string | null;
  phone: string | null;
  email: string | null;
  deliveryType: string | null;
  paymentType: string | null;
  moyskladSyncStatus: "PENDING" | "SYNCED" | "FAILED" | "SKIPPED";
  moyskladSyncError: string | null;
};

const MOYSKLAD_STATUS_BADGES: Record<Order["moyskladSyncStatus"], { label: string; className: string }> = {
  PENDING: { label: "Списание...", className: "bg-slate-100 text-slate-500" },
  SYNCED: { label: "Списано", className: "bg-emerald-100 text-emerald-700" },
  FAILED: { label: "Ошибка списания", className: "bg-red-100 text-red-700" },
  SKIPPED: { label: "Не списывалось", className: "bg-slate-100 text-slate-400" },
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новый",
  PROCESSING: "В обработке",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) throw new Error("Ошибка загрузки заказов");
      const data = await res.json();
      setOrders(data.orders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changeStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Ошибка обновления статуса");
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Заказы</h1>
        <a
          href="/api/admin/orders/export"
          className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500 hover:text-white"
        >
          Экспорт CSV
        </a>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-sm text-slate-400">Загрузка...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-slate-400">Заказов пока нет</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Номер</th>
                <th className="py-2 pr-4">Дата</th>
                <th className="py-2 pr-4">Клиент</th>
                <th className="py-2 pr-4">Сумма</th>
                <th className="py-2 pr-4">Статус</th>
                <th className="py-2 pr-4">МойСклад</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-900">{o.number}</td>
                  <td className="py-3 pr-4 text-slate-500">
                    {new Date(o.createdAt).toLocaleString("ru-RU")}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="text-slate-900">{o.customerName || o.user?.name || "—"}</div>
                    <div className="text-xs text-slate-500">{o.phone || o.user?.phone || "Телефон не указан"}</div>
                    <div className="text-xs text-slate-400">{o.email || o.user?.email}</div>
                  </td>
                  <td className="py-3 pr-4 font-semibold text-amber-600">{o.total} ₽</td>
                  <td className="py-3 pr-4">
                    <div className="mb-1 text-xs text-slate-400">
                      {o.deliveryType === "courier" ? "Доставка" : "Самовывоз"} · {o.paymentType || "Оплата при получении"}
                    </div>
                    <select
                      value={o.status}
                      disabled={updatingId === o.id}
                      onChange={(e) => changeStatus(o.id, e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-amber-400"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${MOYSKLAD_STATUS_BADGES[o.moyskladSyncStatus].className}`}
                      title={o.moyskladSyncStatus === "FAILED" ? o.moyskladSyncError ?? undefined : undefined}
                    >
                      {MOYSKLAD_STATUS_BADGES[o.moyskladSyncStatus].label}
                    </span>
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
