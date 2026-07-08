"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const LINKS = [
  { label: "Мой кабинет", href: "/personal" },
  { label: "Текущие заказы", href: "/personal/orders" },
  { label: "Личные данные", href: "/personal/private" },
  { label: "Сменить пароль", href: "/personal/password" },
  { label: "История заказов", href: "/personal/orders/history" },
  { label: "Профиль заказа", href: "/personal/profiles" },
  { label: "Избранные товары", href: "/personal/favorite" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-full lg:w-64 lg:flex-shrink-0">
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {LINKS.map((link) => {
          const active =
            link.href === "/personal"
              ? pathname === "/personal"
              : pathname === link.href ||
                (link.href === "/personal/orders" && pathname === "/personal/orders");
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block px-5 py-3 text-sm transition ${
                  active
                    ? "font-semibold text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm text-slate-500 transition hover:text-slate-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            Выйти
          </button>
        </li>
      </ul>
    </nav>
  );
}
