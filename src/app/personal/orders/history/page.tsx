import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "../../PageHeader";

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новый",
  PROCESSING: "В обработке",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

export default async function OrdersHistoryPage() {
  const session = await auth();
  const orders = session?.user?.id
    ? await prisma.order.findMany({
        where: {
          userId: session.user.id,
          status: { in: ["DELIVERED", "CANCELLED"] },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <>
      <PageHeader title="Мои заказы" crumb="Мои заказы" />

      {orders.length === 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-slate-700">История заказов отсутствует</h2>
          <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4">
            <Link href="/personal/orders" className="text-slate-700 transition hover:text-slate-900">
              Посмотреть текущие заказы
            </Link>
          </div>
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
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{String(order.total)} ₽</p>
                <p className="text-sm text-slate-500">{STATUS_LABELS[order.status] ?? order.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
