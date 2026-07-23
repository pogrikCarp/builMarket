import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "../PageHeader";

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новый",
  PROCESSING: "В обработке",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

export default async function OrdersPage() {
  const session = await auth();
  const orders = session?.user?.id
    ? await prisma.order.findMany({
        where: {
          userId: session.user.id,
          status: { in: ["NEW", "PROCESSING", "SHIPPED"] },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <>
      <PageHeader title="Мои заказы" crumb="Мои заказы" />

      {orders.length === 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-slate-700">Текущие заказы не найдены</h2>
          <Link
            href="/personal/orders/history"
            className="block rounded-lg border border-slate-200 bg-white px-5 py-4 text-slate-700 transition hover:border-amber-300 hover:text-slate-900"
          >
            Посмотреть историю заказов
          </Link>
          <Link
            href="/"
            className="block rounded-lg border border-slate-200 bg-white px-5 py-4 text-slate-700 transition hover:border-amber-300 hover:text-slate-900"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4"
            >
              <div>
                <p className="font-semibold text-slate-900">Заказ №{order.number}</p>
                <p className="text-sm text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {order.deliveryType === "courier" ? "Доставка" : "Самовывоз"} · {order.phone || "Телефон не указан"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{String(order.total)} ₽</p>
                <p className="text-sm text-amber-600">{STATUS_LABELS[order.status] ?? order.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
