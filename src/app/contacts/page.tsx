import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

const missingDataClass =
  "mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-600";

const WORK_HOURS = [
  { label: "Понедельник", hours: "10:00–18:00" },
  { label: "Вторник", hours: "10:00–18:00" },
  { label: "Среда", hours: "10:00–18:00" },
  { label: "Четверг", hours: "10:00–18:00" },
  { label: "Пятница", hours: "10:00–18:00" },
  { label: "Суббота", hours: "10:00–18:00" },
  { label: "Воскресенье", hours: "10:00–18:00" },
];

const YANDEX_NAVIGATOR_URL =
  "https://yandex.ru/navi?text=55.368630,37.894418&si=9xmb887e2g69qwtvhxn1wp4k8c";

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-900">
      <main>
        <section className="relative overflow-hidden border-b border-amber-100/70">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fff7e8] via-white to-[#f4ead9]" />
          <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
            <Link href="/" className="text-xs font-semibold uppercase tracking-[0.45em] text-amber-600 transition hover:text-amber-700">
              ← ДомСтрой
            </Link>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-600">Контактная информация</p>
                <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                  Всегда на связи по вопросам заказа и поставки
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  Поможем подобрать строительные материалы, рассчитать объём, согласовать доставку и подготовить документы для частного покупателя или организации.
                </p>
              </div>
              <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700 shadow-sm">
                <span className="font-bold">Красным отмечены данные компании, которые необходимо предоставить</span>, чтобы завершить страницу перед публикацией.
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <div className="grid gap-5 md:grid-cols-3">
            <article className="group rounded-[28px] border border-amber-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-700">✉</div>
              <h2 className="mt-5 text-xl font-semibold">Обратная связь</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Отправьте вопрос, пожелание или предложение. Ответим по электронной почте.
              </p>
              <a href="mailto:domstroy.dmd@mail.ru" className="mt-5 inline-flex text-sm font-semibold text-amber-700 transition hover:text-amber-800">
                domstroy.dmd@mail.ru →
              </a>
            </article>

            <article className="group rounded-[28px] border border-amber-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-700">☎</div>
              <h2 className="mt-5 text-xl font-semibold">Клиентская поддержка</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Подскажем по ассортименту, наличию, оплате, комплектации заказа и доставке.
              </p>
              <div className="mt-5 space-y-2 text-sm font-semibold text-amber-700">
                <a href="tel:+79160045522" className="block transition hover:text-amber-800">+7 916 004-55-22</a>
                <a href="tel:+79160045522" className="block transition hover:text-amber-800">+7 916 004-55-22</a>
              </div>
            </article>

            <article className="group rounded-[28px] border border-amber-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-700">⌖</div>
              <h2 className="mt-5 text-xl font-semibold">Адрес магазина</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Перед поездкой уточните адрес, наличие товара и возможность самовывоза.
              </p>
              <address className="mt-3 not-italic rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                Верхняя улица, 15/1, деревня Кутузово, городской округ Домодедово, Московская область
              </address>
            </article>
          </div>
        </section>

        <section className="border-y border-amber-100 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-600">Офис и реквизиты</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Информация о компании</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Эти сведения помогут покупателям найти офис, подготовить договор и проверить юридическую информацию перед оплатой.
              </p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="rounded-3xl bg-[#f8f4ed] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Центральный офис</p>
                  <address className="mt-3 not-italic text-sm leading-6 text-slate-700">
                    Верхняя улица, 15/1, деревня Кутузово, городской округ Домодедово, Московская область
                  </address>
                </div>
                <div className="rounded-3xl bg-[#f8f4ed] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Юридическое лицо</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">ООО «ДомСтрой»</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">ИНН 5009073556 / КПП 500901001</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">ОГРН 1105009000898 / ОКВЭД 51.6 / ОКПО 63579656</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">Верхняя улица, 15/1, деревня Кутузово, городской округ Домодедово, Московская область</p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-slate-900 p-7 text-white shadow-xl md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-400">Связаться с нами</p>
              <h2 className="mt-3 text-3xl font-semibold">Один звонок — и мы начнём расчёт</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Позвоните на бесплатную линию или напишите нам. Для быстрого расчёта подготовьте список материалов, количество и адрес доставки.
              </p>
              <div className="mt-7 space-y-3">
                <a href="tel:+79160045522" className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-4 text-sm font-semibold transition hover:bg-amber-500 hover:text-slate-950">
                  <span>Бесплатная линия</span>
                  <span>+7 916 004-55-22</span>
                </a>
                <a href="tel:+79160045522" className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-4 text-sm font-semibold transition hover:bg-amber-500 hover:text-slate-950">
                  <span>Городской номер</span>
                  <span>+7 916 004-55-22</span>
                </a>
                <a href="mailto:domstroy.dmd@mail.ru" className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-4 text-sm font-semibold transition hover:bg-amber-500 hover:text-slate-950">
                  <span>Электронная почта</span>
                  <span>domstroy.dmd@mail.ru</span>
                </a>
              </div>
              <div className="mt-6 rounded-2xl border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm font-semibold leading-6 text-red-300">
                Нужны часы работы телефонной поддержки
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-600">Как нас найти</p>
          <h2 className="mt-3 text-3xl font-semibold">Магазин и самовывоз</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Показываем точный адрес, режим работы и карту проезда, чтобы вам было удобно доехать за товаром или оформить самовывоз.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="flex flex-col gap-5">
              <div className="rounded-[28px] border border-amber-100 bg-[#fff8eb] p-6 md:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Адрес магазина</p>
                <address className="mt-3 not-italic text-lg font-semibold leading-6 text-slate-900">
                  Верхняя улица, 15/1, деревня Кутузово, городской округ Домодедово, Московская область
                </address>

                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg text-amber-700" aria-hidden>
                    🅿
                  </span>
                  На территории есть бесплатная парковка для посетителей
                </div>

                <a
                  href={YANDEX_NAVIGATOR_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-600 sm:w-auto"
                >
                  Проложить маршрут в Яндекс Навигаторе
                  <span aria-hidden>→</span>
                </a>
              </div>

              <div className="rounded-[28px] border border-amber-100 bg-white p-6 shadow-sm md:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Режим работы</p>
                <ul className="mt-4 divide-y divide-slate-100 text-sm">
                  {WORK_HOURS.map((day) => (
                    <li key={day.label} className="flex items-center justify-between py-2.5 text-slate-600">
                      <span>{day.label}</span>
                      <span className="font-semibold text-slate-900">{day.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={missingDataClass}>Нужны ссылки на ВКонтакте и Telegram</div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="map-frame overflow-hidden rounded-[28px] border border-amber-100 shadow-sm">
                <iframe
                  src="https://yandex.ru/map-widget/v1/-/CTqv7Dnm"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="ДомСтрой на карте"
                />
              </div>
              <p className="text-center text-xs text-slate-400 lg:text-left">
                Карта проезда до магазина ДомСтрой
              </p>
            </div>
          </div>
        </section>

        <section id="feedback" className="mx-auto max-w-7xl px-4 pb-12 lg:pb-16">
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-600">Обратная связь</p>
            <h2 className="mt-3 text-3xl font-semibold">Напишите нам</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Заполните данные и опишите вопрос. Сообщение можно отправить через ваш почтовый клиент.
            </p>
            <form action="mailto:domstroy.dmd@mail.ru" method="post" encType="text/plain" className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm font-medium text-slate-700">
                Ваше имя
                <input name="name" required placeholder="Иван Иванов" className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#faf9f7] px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Телефон
                <input name="phone" type="tel" required placeholder="+7 (999) 000-00-00" className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#faf9f7] px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100" />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Электронная почта
                <input name="email" type="email" placeholder="name@company.ru" className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#faf9f7] px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100" />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-4">
                Сообщение
                <textarea name="message" required rows={5} placeholder="Опишите ваш вопрос" className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#faf9f7] px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100" />
              </label>
              <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between lg:col-span-4">
                <p className="max-w-md text-xs leading-5 text-slate-500">
                  Отправляя сообщение, вы соглашаетесь с <Link href="/personal-data" className="font-semibold text-amber-700 hover:text-amber-800">политикой обработки персональных данных</Link>.
                </p>
                <button type="submit" className="shrink-0 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 hover:text-slate-950">
                  Отправить сообщение
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
