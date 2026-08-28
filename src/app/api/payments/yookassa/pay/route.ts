import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";
import { createYookassaPayment, isYookassaConfigured } from "@/lib/yookassa";

// Создаёт платёж в ЮKassa и перенаправляет пользователя на страницу оплаты
// (сценарий подтверждения Redirect, см. src/lib/yookassa.ts). Вызывается при
// клике на кнопку «Оплатить» на странице заказа.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("order");

  if (!isYookassaConfigured()) {
    return NextResponse.json({ error: "Онлайн-оплата ещё не подключена" }, { status: 503 });
  }
  if (!orderNumber) {
    return NextResponse.json({ error: "Не указан номер заказа" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { number: orderNumber } });
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.redirect(`${SITE_URL}/order?paid=${encodeURIComponent(orderNumber)}`);
  }

  let payment;
  try {
    payment = await createYookassaPayment({
      amountRub: Number(order.total),
      orderNumber: order.number,
      returnUrl: `${SITE_URL}/order?paid=${encodeURIComponent(orderNumber)}`,
      description: `Заказ №${order.number}`,
    });
  } catch (error) {
    console.error("[yookassa] Не удалось создать платёж", error);
    return NextResponse.json({ error: "Не удалось создать платёж в ЮKassa" }, { status: 502 });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentProvider: "yookassa", paymentOperationId: payment.id },
  });

  const confirmationUrl = payment.confirmation?.confirmation_url;
  if (!confirmationUrl) {
    console.error("[yookassa] В ответе ЮKassa нет confirmation_url", payment);
    return NextResponse.json({ error: "ЮKassa не вернула ссылку на оплату" }, { status: 502 });
  }

  return NextResponse.redirect(confirmationUrl);
}
