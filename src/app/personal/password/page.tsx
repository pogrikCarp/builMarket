"use client";

import { useState } from "react";
import { PageHeader } from "../PageHeader";

export default function PasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirm) {
      setStatus("error");
      setMessage("Пароли не совпадают");
      return;
    }

    setStatus("saving");

    const res = await fetch("/api/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Ошибка");
      return;
    }

    setStatus("ok");
    setMessage("Пароль успешно изменён");
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
  };

  return (
    <>
      <PageHeader title="Сменить пароль" crumb="Сменить пароль" />
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <form onSubmit={handleSubmit} className="max-w-md space-y-5">
          {message && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                status === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
              }`}
            >
              {message}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Текущий пароль</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Новый пароль *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Подтвердите новый пароль *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded-lg bg-slate-700 px-6 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {status === "saving" ? "Сохранение..." : "Сменить пароль"}
          </button>
        </form>
      </div>
    </>
  );
}
