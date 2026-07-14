"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

type Props = {
  variant?: "icon" | "inline";
  className?: string;
};

export default function CartButton({ variant = "icon", className = "" }: Props) {
  const { itemCount } = useCart();
  const count = itemCount;

  if (variant === "inline") {
    return (
      <Link
        href="/basket"
        aria-label="Корзина"
        className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 ${className}`.trim()}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21h6" />
        </svg>
        <span>Корзина</span>
        <span suppressHydrationWarning className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
          {count}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/basket"
      aria-label="Корзина"
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center text-slate-500 transition hover:text-amber-600 ${className}`.trim()}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21h6" />
      </svg>
      <span suppressHydrationWarning className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
        {count}
      </span>
    </Link>
  );
}
