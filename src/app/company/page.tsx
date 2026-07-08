"use client";

import Link from "next/link";
import { useState } from "react";

const INTRO_PARAGRAPHS = [
  "ДомСтрой — это магазин строительных и отделочных материалов для тех, кто строит дом, делает ремонт в квартире, обновляет коммерческое помещение или благоустраивает участок. Мы помогаем собрать нужные товары в одном месте, чтобы покупателю не приходилось тратить время на поиск материалов по разным магазинам.",
  "В нашем ассортименте представлены сухие смеси, грунтовки, краски, крепёж, инструменты, инженерная сантехника, электрика, отделочные материалы и другие товары, которые нужны на объекте каждый день. Мы ориентируемся на практичные решения: товары должны быть понятными в работе, надежными и доступными по цене.",
  "Наша команда работает с частными покупателями, мастерами, строительными бригадами и организациями. Для каждого заказа мы стараемся подобрать оптимальное решение: где-то важна цена, где-то скорость доставки, а где-то точное соответствие материала технической задаче.",
];

const SERVICE_PARAGRAPHS = [
  "В ДомСтрой можно не только купить материалы, но и получить консультацию. Менеджеры помогут сориентироваться в ассортименте, подобрать аналог, рассчитать нужный объем, уточнить наличие и подготовить заказ к отгрузке.",
  "Мы понимаем, что ремонт и строительство редко идут строго по плану. Поэтому стараемся быстро обрабатывать заявки, быть на связи и предлагать понятные варианты по доставке, разгрузке, подъему и дополнительным услугам.",
];

const HIGHLIGHTS = [
  {
    title: "Материалы на все этапы",
    description: "Собираем востребованные товары для ремонта, стройки и благоустройства в одном каталоге.",
  },
  {
    title: "Практичный подход",
    description: "Подбираем решения, с которыми удобно работать и легко планировать бюджет.",
  },
  {
    title: "Для частных и b2b клиентов",
    description: "Помогаем владельцам квартир, домов, коммерческих объектов и подрядчикам.",
  },
];

const BENEFITS = [
  "Оперативная доставка по Москве и Московской области",
  "Широкий выбор строительных и отделочных материалов",
  "Подбор товаров под задачу, бюджет и особенности объекта",
  "Помощь с расчетом доставки, разгрузки и подъема",
  "Колеровка, распил и погрузка материалов в магазине",
  "Онлайн-заказ через сайт или оформление по телефону",
];

const CTA_HEADING = "ДомСтрой — надежный помощник в ремонте и строительстве";
const CTA_PARAGRAPH =
  "Мы делаем закупку материалов проще: помогаем выбрать нужное, не переплатить, оформить заказ и получить товары вовремя. Выбирая ДомСтрой, вы выбираете понятный сервис, рабочий ассортимент и поддержку на каждом этапе покупки.";

const CallbackModal = ({ onClose }: { onClose: () => void }) => {
  const [agreed, setAgreed] = useState(false);
  const captchaChars = "WCSF";
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Закрыть"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold text-slate-900">Заказать звонок</h2>
        <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <div>
            <label className="block text-sm text-slate-700">
              Ваше имя <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700">
              Телефон <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="+7 (___) ___-__-__"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700">
              Введите текст с картинки <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="text"
                required
                className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <div className="flex items-center gap-2">
                <div className="select-none rounded border border-slate-300 bg-slate-50 px-4 py-2 font-mono text-xl font-bold tracking-[0.3em] text-slate-800 [text-decoration:line-through_wavy_rgba(0,0,0,0.2)]">
                  {captchaChars}
                </div>
                <button type="button" className="text-slate-400 hover:text-slate-700" title="Обновить">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m0 0A7.001 7.001 0 0 1 18.418 9M4.582 9H9m11 11v-5h-.581m0 0A7.001 7.001 0 0 1 5.582 15M20.419 15H16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
            <button
              type="button"
              onClick={() => setAgreed((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${agreed ? "bg-amber-500" : "bg-slate-300"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${agreed ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
            Я согласен на <span className="text-amber-600 underline">обработку персональных данных</span>
          </label>
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={!agreed}
              className="rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Отправить
            </button>
            <span className="text-xs text-slate-400">* – обязательные поля</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CompanyPage() {
  const [callbackOpen, setCallbackOpen] = useState(false);
  return (
    <main className="min-h-screen bg-[#f6f3ee] text-slate-900">
      {callbackOpen && <CallbackModal onClose={() => setCallbackOpen(false)} />}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#fff7e8] via-[#fffdf7] to-[#f7f1e6]" />
        <div
          className="pointer-events-none absolute -top-40 left-1/3 h-80 w-80 rounded-full bg-amber-200/45 blur-3xl animate-lux-orb"
          style={{ animationDelay: "0.2s" }}
        />
        <div
          className="pointer-events-none absolute top-1/2 right-[-10%] h-72 w-72 rounded-full bg-amber-300/25 blur-3xl animate-lux-orb"
          style={{ animationDelay: "0.6s" }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-28">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.45em] text-amber-500 transition hover:text-amber-600 animate-fade-up"
            style={{ animationDelay: "0.05s" }}
          >
            <span className="text-base">←</span> на главную
          </Link>
          <h1
            className="mt-10 max-w-4xl text-4xl font-semibold leading-tight text-slate-900 md:text-5xl lg:text-6xl animate-fade-up"
            style={{ animationDelay: "0.12s" }}
          >
            ДомСтрой — магазин строительных материалов для ремонта, стройки и благоустройства
          </h1>
          <div className="mt-10 space-y-6 text-lg leading-relaxed text-slate-600">
            {INTRO_PARAGRAPHS.map((paragraph, index) => (
              <p key={paragraph} className="animate-fade-up" style={{ animationDelay: `${0.2 + index * 0.12}s` }}>
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {HIGHLIGHTS.map((item, index) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-3xl border border-amber-100 bg-white px-6 py-8 shadow-[0_25px_60px_-35px_rgba(119,76,21,0.35)] transition hover:border-amber-300 hover:shadow-[0_30px_70px_-45px_rgba(177,102,11,0.45)] animate-fade-up"
                style={{ animationDelay: `${0.45 + index * 0.12}s` }}
              >
                <span className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-amber-100 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,199,110,0.28),_transparent_60%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-[-35%] -z-10 h-[420px] bg-[radial-gradient(circle_at_bottom,_rgba(255,240,220,0.5),_transparent_75%)]" />
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Сервис, который помогает строить проще
          </h2>
          <div className="mt-6 space-y-6 text-lg leading-relaxed text-slate-600">
            {SERVICE_PARAGRAPHS.map((paragraph, index) => (
              <p key={paragraph} className="animate-fade-up" style={{ animationDelay: `${0.22 + index * 0.12}s` }}>
                {paragraph}
              </p>
            ))}
          </div>

          <h3 className="mt-12 text-2xl font-semibold text-slate-900 md:text-3xl animate-fade-up" style={{ animationDelay: "0.38s" }}>
            Почему выбирают ДомСтрой
          </h3>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {BENEFITS.map((benefit, index) => (
              <div
                key={benefit}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#fff8eb] to-[#ffeacc] p-6 text-sm font-semibold text-slate-700 shadow-[0_20px_60px_-45px_rgba(183,119,32,0.3)] ring-1 ring-amber-100 transition hover:ring-amber-200 animate-fade-up"
                style={{ animationDelay: `${0.46 + index * 0.08}s` }}
              >
                <span className="absolute inset-px -z-10 rounded-[26px] bg-gradient-to-br from-amber-100/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <span className="mr-3 inline-flex h-2 w-2 shrink-0 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(244,160,30,0.6)]" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-[44px] bg-gradient-to-r from-[#fff0d1] via-[#ffe3ac] to-[#ffd28b] p-[1px] shadow-[0_35px_90px_-45px_rgba(236,170,40,0.5)]">
            <div className="relative rounded-[42px] bg-white px-8 py-14 text-[#2d1c0d] md:px-14 md:py-16">
              <div className="pointer-events-none absolute -top-20 right-16 h-52 w-52 rounded-full bg-amber-100/60 blur-3xl" />
              <div className="pointer-events-none absolute bottom-[-120px] left-24 h-64 w-64 rounded-full bg-amber-200/50 blur-3xl" />
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl animate-fade-up" style={{ animationDelay: "0.1s" }}>
                {CTA_HEADING}
              </h2>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-[#4c3520] animate-fade-up" style={{ animationDelay: "0.22s" }}>
                {CTA_PARAGRAPH}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => setCallbackOpen(true)}
                  className="inline-flex items-center justify-center rounded-full bg-[#2d1c0d] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-amber-200 transition hover:bg-[#3a2614] animate-fade-up"
                  style={{ animationDelay: "0.34s" }}
                >
                  Позвонить ДомСтрой
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-[#2d1c0d]/15 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#2d1c0d] transition hover:border-[#2d1c0d]/35 hover:bg-[#2d1c0d]/5 animate-fade-up"
                  style={{ animationDelay: "0.38s" }}
                >
                  Вернуться на главную
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
