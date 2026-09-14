"use client";

import { useCallback, useEffect, useState } from "react";

type SyncRun = {
  id: string;
  mode: string;
  status: "RUNNING" | "OK" | "FAILED";
  trigger: string | null;
  itemCount: number;
  imageCount: number;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
};

type SyncStatus = {
  productCount: number;
  archivedCount: number;
  folderCount: number;
  isRunning: boolean;
  lastRuns: SyncRun[];
};

const MODE_LABELS: Record<string, string> = {
  full: "Полная синхронизация",
  stock: "Остатки и цены",
  products: "Отдельные товары",
};

const TRIGGER_LABELS: Record<string, string> = {
  cron: "по расписанию",
  admin: "из админки",
  order: "после заказа",
  webhook: "вебхук МойСклад",
  bootstrap: "после деплоя",
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
}

function formatDuration(run: SyncRun) {
  if (!run.finishedAt) return "выполняется…";
  const seconds = Math.max(1, Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000));
  if (seconds < 60) return `${seconds} с`;
  return `${Math.floor(seconds / 60)} мин ${seconds % 60} с`;
}

export default function CatalogSyncManager() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/catalog-sync", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Не удалось получить статус");
      setStatus(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки статуса");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Пока синхронизация идёт, подтягиваем статус - полная занимает минуты, и без
  // автообновления администратору пришлось бы перезагружать страницу вручную.
  useEffect(() => {
    if (!status?.isRunning) return;
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [status?.isRunning, load]);

  const start = async (mode: "full" | "stock") => {
    setStarting(mode);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/catalog-sync?mode=${mode}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Не удалось запустить синхронизацию");

      setMessage(
        mode === "full"
          ? "Полная синхронизация запущена — обновление каталога и загрузка новых фотографий идут в фоне."
          : `Остатки и цены обновлены: ${data.itemCount ?? 0} позиций.`
      );
      await load();
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Ошибка запуска");
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Управление каталогом</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Каталог хранится в собственной базе сайта и обновляется из МойСклад фоновой
          синхронизацией: остатки и цены — каждые 10 минут, полное обновление (описания,
          характеристики, фотографии) — раз в сутки ночью, а также сразу после оформления
          заказа. Посетители сайта работают только с этой базой, поэтому каталог открывается
          мгновенно и МойСклад не получает запросов от трафика сайта.
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Загрузка статуса…</p>
        ) : (
          <>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Товаров в каталоге</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{status?.productCount ?? 0}</dd>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Категорий</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{status?.folderCount ?? 0}</dd>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Скрыто (нет в МойСклад)</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{status?.archivedCount ?? 0}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => start("full")}
                disabled={Boolean(starting) || status?.isRunning}
                className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {starting === "full" ? "Запуск…" : "Обновить каталог полностью"}
              </button>
              <button
                type="button"
                onClick={() => start("stock")}
                disabled={Boolean(starting) || status?.isRunning}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {starting === "stock" ? "Обновление…" : "Обновить остатки и цены"}
              </button>
            </div>

            {status?.isRunning && (
              <p className="mt-4 text-sm text-amber-600">
                Синхронизация выполняется — статус обновляется автоматически.
              </p>
            )}
            {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">История синхронизаций</h2>
        {status && status.lastRuns.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Начало</th>
                  <th className="py-2 pr-4">Тип</th>
                  <th className="py-2 pr-4">Результат</th>
                  <th className="py-2 pr-4">Товаров</th>
                  <th className="py-2 pr-4">Новых фото</th>
                  <th className="py-2">Длительность</th>
                </tr>
              </thead>
              <tbody>
                {status.lastRuns.map((run) => (
                  <tr key={run.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4 whitespace-nowrap text-slate-600">{formatDateTime(run.startedAt)}</td>
                    <td className="py-2 pr-4 text-slate-700">
                      {MODE_LABELS[run.mode] ?? run.mode}
                      {run.trigger && (
                        <span className="text-slate-400"> · {TRIGGER_LABELS[run.trigger] ?? run.trigger}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {run.status === "OK" && <span className="text-emerald-600">успешно</span>}
                      {run.status === "RUNNING" && <span className="text-amber-600">выполняется</span>}
                      {run.status === "FAILED" && (
                        <span className="text-red-600" title={run.error ?? undefined}>
                          ошибка
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">{run.itemCount}</td>
                    <td className="py-2 pr-4 text-slate-600">{run.imageCount}</td>
                    <td className="py-2 whitespace-nowrap text-slate-600">{formatDuration(run)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Синхронизаций пока не было.</p>
        )}
      </div>
    </div>
  );
}
