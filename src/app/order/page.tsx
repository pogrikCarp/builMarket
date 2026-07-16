"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CartButton from "@/components/cart/CartButton";
import { useCart } from "@/components/cart/CartProvider";

type DeliveryType = "pickup" | "courier";
type PaymentType = "cash" | "card" | "invoice";

type FormState = {
  name: string;
  phone: string;
  email: string;
  city: string;
  street: string;
  house: string;
  flat: string;
  comment: string;
  company: string;
  inn: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  email: "",
  city: "Москва",
  street: "",
  house: "",
  flat: "",
  comment: "",
  company: "",
  inn: "",
};

const inputClass = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100";
const cardClass = "rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm";

function formatPrice(value?: number) {
  if (value == null) return "Цена по запросу";
  return (value / 100).toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });
}

export default function OrderPage() {
  const { items, itemCount, total } = useCart();
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [submitted, setSubmitted] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [successCreatedAt, setSuccessCreatedAt] = useState<Date | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const deliveryText = deliveryType === "pickup" ? "Самовывоз из магазина" : "Доставка по адресу";
  const paymentText =
    paymentType === "cash"
      ? "Оплата при получении"
      : paymentType === "card"
        ? "Банковской картой"
        : "Счёт для юрлица";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const generatedId = Math.floor(100000 + Math.random() * 900000).toString();
    setSuccessOrderId(generatedId);
    setSuccessCreatedAt(new Date());
  };

  const renderSummary = () => {
    if (items.length === 0) return null;
    return (
      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Ваш заказ</p>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Позиций</span>
            <span className="font-semibold text-slate-900">{items.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Товаров</span>
            <span className="font-semibold text-slate-900">{itemCount}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-base font-semibold text-slate-900">Итого</span>
            <span className="text-2xl font-bold text-slate-900">{formatPrice(total)}</span>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
          Проверьте состав заказа перед оплатой. При необходимости обновите количество в корзине.
        </div>
      </aside>
    );
  };

  if (successOrderId) {
    const readableDate = successCreatedAt?.toLocaleString("ru-RU", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return (
      <div className="min-h-screen bg-stone-50 text-slate-900">
        <header className="border-b border-slate-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="flex shrink-0 items-center">
              <Image src="/logo.png" alt="ДомСтрой" width={110} height={52} className="h-10 w-auto object-contain sm:h-12" />
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/" className="text-slate-600 hover:text-slate-900">Главная</Link>
              <Link href="/catalog" className="text-slate-600 hover:text-slate-900">Каталог</Link>
              <Link href="/basket" className="text-slate-600 hover:text-slate-900">Корзина</Link>
              <CartButton variant="inline" />
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-600">Заказ сформирован</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">Спасибо! Мы приняли заявку</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
              Номер заказа <span className="font-semibold text-slate-900">№{successOrderId}</span>. Мы свяжемся, как только проверим наличие и подтвердим доставку. Информация об оплате появится в вашем личном кабинете, а пока вы можете проверить состав заказа ниже.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                <div>
                  <p>Создан: {readableDate ?? "только что"}</p>
                  <p className="mt-1">Статус: <span className="font-semibold text-emerald-600">ожидает подтверждения менеджера</span></p>
                </div>
                <div>
                  Номер оплаты: <span className="font-semibold text-slate-900">№{successOrderId}/1</span>
                </div>
              </div>

              <div className="rounded-[28px] border border-amber-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-600">Оплата заказа</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-semibold text-slate-900">₽</div>
                  <div>
                    <p className="font-semibold text-slate-900">Онлайн-оплата будет подключена позже</p>
                    <p className="text-xs text-slate-500">Сумма к оплате: {formatPrice(total)}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-6 text-slate-500">
                  Услугу предоставляет выбранный платёжный провайдер. После подтверждения менеджером вы сможете перейти к оплате и подписать документы.
                </p>
                <button
                  type="button"
                  onClick={() => alert("Онлайн-оплата появится после подключения платёжного провайдера.")}
                  className="mt-4 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 hover:text-slate-950"
                >
                  Оплатить
                </button>
                <div className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">
                  Обратите внимание: если вы передумаете, обратитесь к менеджеру для отмены и возврата средств.
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Следующие шаги</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li>1. Менеджер позвонит для подтверждения наличия и адреса доставки.</li>
                </ul>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/catalog" className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600">
                    В каталог
                  </Link>
                  <Link href="/basket" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
                    Вернуться в корзину
                  </Link>
                </div>
              </div>
            </section>
            {renderSummary()}
          </div>
        </main>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 text-slate-900">
        <header className="border-b border-slate-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="flex shrink-0 items-center">
              <Image src="/logo.png" alt="ДомСтрой" width={110} height={52} className="h-10 w-auto object-contain sm:h-12" />
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/" className="text-slate-600 hover:text-slate-900">Главная</Link>
              <Link href="/catalog" className="text-slate-600 hover:text-slate-900">Каталог</Link>
              <Link href="/basket" className="text-slate-600 hover:text-slate-900">Корзина</Link>
              <CartButton variant="inline" />
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-600">Оформление заказа</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900">Корзина пуста</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Добавьте товары в корзину, и здесь появится страница оформления заказа с контактными данными, доставкой и итоговой суммой.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/catalog" className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600">
                Перейти в каталог
              </Link>
              <Link href="/basket" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
                Открыть корзину
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex shrink-0 items-center">
            <Image src="/logo.png" alt="ДомСтрой" width={110} height={52} className="h-10 w-auto object-contain sm:h-12" />
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-slate-600 hover:text-slate-900">Главная</Link>
            <Link href="/catalog" className="text-slate-600 hover:text-slate-900">Каталог</Link>
            <Link href="/basket" className="text-slate-600 hover:text-slate-900">Корзина</Link>
            <CartButton variant="inline" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-600">Оформление заказа</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">Подтвердите состав и оставьте контакты</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Мы сохранили минималистичную структуру checkout: данные покупателя, способ получения, оплата и итоговый состав заказа справа.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
            {itemCount} {itemCount === 1 ? "товар" : itemCount < 5 ? "товара" : "товаров"} в заказе
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitted && (
              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-6 py-5 text-sm leading-6 text-emerald-900 shadow-sm">
                Форма заказа заполнена. Визуальная часть оформления готова; на следующем шаге можно подключить отправку заказа в CRM, Telegram, email или МойСклад.
              </div>
            )}

            <section className={cardClass}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">1. Контакты</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Получатель заказа</h2>
                </div>
                <p className="text-sm text-slate-500">Менеджер свяжется для подтверждения наличия и стоимости доставки.</p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">ФИО</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className={inputClass}
                    placeholder="Иванов Иван Иванович"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Телефон</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    className={inputClass}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className={inputClass}
                    placeholder="name@company.ru"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Компания <span className="text-red-500">*</span>
                    <span className="ml-1 text-xs font-normal text-slate-400">(необязательно)</span>
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(event) => updateField("company", event.target.value)}
                    className={inputClass}
                    placeholder="ООО СтройСнаб"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    ИНН <span className="text-red-500">*</span>
                    <span className="ml-1 text-xs font-normal text-slate-400">(необязательно)</span>
                  </label>
                  <input
                    type="text"
                    value={form.inn}
                    onChange={(event) => updateField("inn", event.target.value)}
                    className={inputClass}
                    placeholder="7701234567"
                  />
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">2. Получение</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Способ получения заказа</h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType("pickup")}
                  className={`rounded-[24px] border px-5 py-5 text-left transition ${
                    deliveryType === "pickup"
                      ? "border-amber-300 bg-amber-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-base font-semibold text-slate-900">Самовывоз</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Заберёте заказ самостоятельно после подтверждения менеджером.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("courier")}
                  className={`rounded-[24px] border px-5 py-5 text-left transition ${
                    deliveryType === "courier"
                      ? "border-amber-300 bg-amber-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-base font-semibold text-slate-900">Доставка</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Укажите адрес, а стоимость и интервал доставки уточнит менеджер.</p>
                </button>
              </div>

              {deliveryType === "courier" && (
                <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_1.2fr_0.55fr_0.55fr]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Город</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(event) => updateField("city", event.target.value)}
                      className={inputClass}
                      placeholder="Москва"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Улица</label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={(event) => updateField("street", event.target.value)}
                      className={inputClass}
                      placeholder="Ленинский проспект"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Дом</label>
                    <input
                      type="text"
                      value={form.house}
                      onChange={(event) => updateField("house", event.target.value)}
                      className={inputClass}
                      placeholder="15"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Кв./офис</label>
                    <input
                      type="text"
                      value={form.flat}
                      onChange={(event) => updateField("flat", event.target.value)}
                      className={inputClass}
                      placeholder="24"
                    />
                  </div>
                </div>
              )}
            </section>

            <section className={cardClass}>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">3. Оплата</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Как вам удобно оплатить</h2>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  { id: "cash", title: "Наличными", text: "Оплата при получении заказа." },
                  { id: "card", title: "Картой", text: "Оплата банковской картой при получении." },
                  { id: "invoice", title: "Счёт", text: "Выставим счёт для юридического лица." },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPaymentType(option.id as PaymentType)}
                    className={`rounded-[24px] border px-5 py-5 text-left transition ${
                      paymentType === option.id
                        ? "border-amber-300 bg-amber-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-base font-semibold text-slate-900">{option.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{option.text}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className={cardClass}>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">4. Комментарий</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Дополнительная информация</h2>
              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">Комментарий к заказу</label>
                <textarea
                  rows={5}
                  value={form.comment}
                  onChange={(event) => updateField("comment", event.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Удобное время звонка, особенности разгрузки, пожелания по документам"
                />
              </div>
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
                Нажимая кнопку ниже, вы подтверждаете согласие с условиями обработки персональных данных и политикой конфиденциальности.
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-amber-700">
                <Link href="/privacy" className="hover:text-slate-900">Политика конфиденциальности</Link>
                <Link href="/personal-data" className="hover:text-slate-900">Политика обработки персональных данных</Link>
              </div>
              <button
                type="submit"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Подтвердить оформление
              </button>
            </section>
          </form>

          <aside className="h-fit space-y-5 xl:sticky xl:top-6">
            <section className={`${cardClass} p-0`}>
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Ваш заказ</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Состав и итог</h2>
              </div>

              <div className="space-y-4 px-6 py-5">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-6 text-slate-900">{item.name}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        {item.article && <span>Арт: {item.article}</span>}
                        {item.code && <span>Код: {item.code}</span>}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Количество: {item.quantity}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatPrice((item.price ?? 0) * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={cardClass}>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Товаров</span>
                  <span className="font-semibold text-slate-900">{itemCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Получение</span>
                  <span className="font-semibold text-slate-900">{deliveryText}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Оплата</span>
                  <span className="font-semibold text-slate-900">{paymentText}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-base font-semibold text-slate-900">Итого</span>
                  <span className="text-2xl font-bold text-slate-900">{formatPrice(total)}</span>
                </div>
              </div>
              <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
                После подтверждения менеджер согласует наличие, срок сборки и стоимость доставки.
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/basket" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
                  Вернуться в корзину
                </Link>
                <Link href="/catalog" className="rounded-2xl px-4 py-3 text-sm font-semibold text-amber-700 transition hover:text-slate-900">
                  Добавить ещё товары
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
