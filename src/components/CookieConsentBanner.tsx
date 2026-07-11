"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "domstroy_cookie_consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(CONSENT_KEY) !== "accepted");
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-amber-200/70 bg-white/95 shadow-[0_24px_80px_rgba(23,16,8,0.22)] backdrop-blur-xl">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div className="max-w-4xl flex-1">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-amber-600 lg:text-left">cookies</p>
            <h2 className="mt-2 text-center text-lg font-semibold text-slate-950 lg:text-left">Мы используем технические cookies</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Они помогают сайту корректно работать, сохранять настройки и собирать технические данные о посещении. Нажимая «Принять», вы соглашаетесь с использованием cookies и обработкой технических данных.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs font-semibold text-amber-700 lg:justify-start">
              <Link href="/privacy" className="transition hover:text-slate-900">
                Политика конфиденциальности
              </Link>
              <Link href="/personal-data" className="transition hover:text-slate-900">
                Политика обработки данных
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={acceptCookies}
            className="w-full shrink-0 rounded-full bg-slate-950 px-7 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-amber-100 shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-amber-500 hover:text-white lg:w-auto"
          >
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}
