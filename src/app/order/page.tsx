import type { Metadata } from "next";
import { Suspense } from "react";
import OrderClient from "./OrderClient";
import { buildMetadata } from "@/lib/seo";

// Оформление заказа - транзакционный шаг, а не страница для поиска.
export const metadata: Metadata = buildMetadata({
  title: "Оформление заказа",
  description: "Оформление заказа в магазине ДомСтрой: доставка, оплата и подтверждение состава корзины.",
  path: "/order",
  noindex: true,
});

export default function OrderPage() {
  return (
    <Suspense fallback={null}>
      <OrderClient />
    </Suspense>
  );
}
