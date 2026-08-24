"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterClient() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Ошибка регистрации");
      return;
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    router.push("/personal");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="mb-6 flex justify-center">
          <Image src="/logo.png" alt="ДомСтрой" width={140} height={60} className="h-14 w-auto object-contain" />
        </Link>
        <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900">Регистрация</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Фамилия Имя Отчество</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              placeholder="Иванов Иван Иванович"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              placeholder="name@company.ru"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Телефон *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              placeholder="+7 (999) 123-45-67"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Пароль *</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              placeholder="Минимум 6 символов"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-700">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
