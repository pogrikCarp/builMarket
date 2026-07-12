import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

const FAQ_ITEMS = [
  {
    question: "Как оформить заказ?",
    answer: "Выберите товары в каталоге и оформите заказ на сайте или по телефону 8 800 250 76 26. Менеджер уточнит детали и подскажет по наличию.",
  },
  {
    question: "Какие способы оплаты доступны?",
    answer: "Наличный и безналичный расчёт, оплата картой онлайн, а также покупка в кредит через банки-партнёры.",
  },
  {
    question: "Как быстро доставляют заказ?",
    answer: "Сроки доставки зависят от объёма заказа и адреса — обычно от 1 до 3 дней по Москве и области.",
  },
  {
    question: "Можно ли вернуть товар?",
    answer: "Да, возврат и обмен возможны в соответствии с законом «О защите прав потребителей» и гарантийными условиями производителя.",
  },
  {
    question: "Есть ли колеровка красок?",
    answer: "Да, мы подбираем и колеруем краску под нужный оттенок прямо в магазине.",
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-900">
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fff7e8] via-white to-[#f7f1e6]" />
          <div className="mx-auto max-w-4xl px-6 py-20">
            <Link href="/" className="text-xs font-semibold uppercase tracking-[0.45em] text-amber-500">
              ← ДомСтрой
            </Link>
            <p className="mt-8 text-sm uppercase tracking-[0.35em] text-amber-600">информация</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">Вопрос-ответ</h1>
            <div className="mt-10 space-y-4">
              {FAQ_ITEMS.map((item) => (
                <div key={item.question} className="rounded-2xl border border-amber-100 bg-white px-6 py-5 shadow-sm">
                  <p className="text-base font-semibold text-slate-900">{item.question}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</p>
                </div>
              ))}
            </div>
            <Link
              href="/"
              className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 transition hover:text-amber-700"
            >
              Вернуться на главную
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
