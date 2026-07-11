"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Каталог", href: "/admin/catalog" },
  { label: "Заказы", href: "/admin/orders" },
  { label: "Пользователи", href: "/admin/users" },
  { label: "Баннеры и акции", href: "/admin/banners" },
  { label: "Страницы", href: "/admin/pages" },
  { label: "SEO / Редиректы", href: "/admin/seo" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-full lg:w-64 lg:flex-shrink-0">
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block px-5 py-3 text-sm transition ${
                  active ? "font-semibold text-amber-600" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
