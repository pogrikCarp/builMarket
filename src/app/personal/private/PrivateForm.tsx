"use client";

import { useState } from "react";

type Props = {
  initial: {
    name: string;
    email: string;
    phone: string;
    smsPhone: string;
  };
};

export function PrivateForm({ initial }: Props) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [smsPhone, setSmsPhone] = useState(initial.smsPhone);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, smsPhone }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Ошибка сохранения");
      return;
    }

    setStatus("ok");
    setMessage("Изменения сохранены");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            status === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid gap-1.5 sm:grid-cols-[1fr_1.2fr] sm:items-center sm:gap-4">
        <label className="text-sm font-medium text-slate-700">Фамилия Имя Отчество *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          placeholder="Иванов Иван Иванович"
        />
      </div>

      <div className="grid gap-1.5 sm:grid-cols-[1fr_1.2fr] sm:items-center sm:gap-4">
        <label className="text-sm font-medium text-slate-700">E-mail *</label>
        <input
          type="email"
          value={initial.email}
          disabled
          className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-500"
        />
      </div>

      <div className="grid gap-1.5 sm:grid-cols-[1fr_1.2fr] sm:items-center sm:gap-4">
        <label className="text-sm font-medium text-slate-700">Телефон *</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          placeholder="+7 (___) ___-__-__"
        />
      </div>

      <div className="grid gap-1.5 sm:grid-cols-[1fr_1.2fr] sm:items-center sm:gap-4">
        <label className="text-sm font-medium text-slate-700">
          Номер телефона для получения СМС с кодом *
        </label>
        <input
          type="tel"
          value={smsPhone}
          onChange={(e) => setSmsPhone(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          placeholder="+7 (___) ___-__-__"
        />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-lg bg-slate-700 px-6 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {status === "saving" ? "Сохранение..." : "Сохранить изменения"}
        </button>
        <span className="text-sm text-amber-600">* обязательные поля</span>
      </div>
    </form>
  );
}
