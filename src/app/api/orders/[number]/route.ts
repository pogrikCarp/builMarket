import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncYookassaOrderStatus } from "@/lib/order-payment";

// Публичный эндпоинт статуса заказа - используется страницей оформления после
// возврата с оплаты ЮKassa (return_url). Отдаём только нечувствительные поля,
// без имени/телефона/адреса покупателя.
export async function GET(_request: Request, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;

  let order = await prisma.order.findUnique({ where: { number } });

  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  // Активно сверяем оплату с ЮKassa на каждый запрос статуса, а не только по
  // вебхуку - см. подробный комментарий в src/lib/order-payment.ts.
  order = await syncYookassaOrderStatus(order);

  return NextResponse.json({
    order: {
      number: order.number,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      paymentAmount: order.paymentAmount != null ? Number(order.paymentAmount) : null,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    },
  });
}
