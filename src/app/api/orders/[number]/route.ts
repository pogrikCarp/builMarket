import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Публичный эндпоинт статуса заказа - используется страницей оформления после
// возврата с оплаты ЮKassa (return_url). Отдаём только нечувствительные поля,
// без имени/телефона/адреса покупателя.
export async function GET(_request: Request, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;

  const order = await prisma.order.findUnique({
    where: { number },
    select: {
      number: true,
      status: true,
      paymentStatus: true,
      paymentAmount: true,
      total: true,
      createdAt: true,
      paidAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      ...order,
      total: Number(order.total),
      paymentAmount: order.paymentAmount != null ? Number(order.paymentAmount) : null,
    },
  });
}
