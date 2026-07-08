import Link from "next/link";
import { PageHeader } from "./PageHeader";

const CARDS = [
  {
    label: "Текущие заказы",
    href: "/personal/orders",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
    ),
  },
  {
    label: "Личные данные",
    href: "/personal/private",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.5 20.25a7.5 7.5 0 0 1 15 0" />
    ),
  },
  {
    label: "История заказов",
    href: "/personal/orders/history",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    ),
  },
  {
    label: "Профиль заказа",
    href: "/personal/profiles",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    ),
  },
  {
    label: "Подписки",
    href: "/personal/favorite",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 9-8 2-2 8-8-19z" />
    ),
  },
];

export default function PersonalDashboard() {
  return (
    <>
      <PageHeader title="Мой кабинет" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="group flex flex-col items-center justify-center gap-4 rounded-lg border border-slate-200 bg-white p-10 text-center transition hover:border-amber-300 hover:shadow-md"
        >
          <svg
            className="h-12 w-12 text-slate-400 transition group-hover:text-amber-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            viewBox="0 0 24 24"
          >
            {card.icon}
          </svg>
          <span className="text-base font-medium text-slate-700 group-hover:text-slate-900">
            {card.label}
          </span>
        </Link>
      ))}
      </div>
    </>
  );
}
