import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getYookassaPayment, isTrustedYookassaIp } from "@/lib/yookassa";
import { syncYookassaOrderStatus } from "@/lib/order-payment";

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

// HTTP-уведомление от ЮKassa об изменении статуса платежа (см. src/lib/yookassa.ts).
// Тело уведомления от ЮKassa НЕ подписано криптографически, поэтому нельзя
// доверять статусу прямо из запроса - вместо этого мы всегда перезапрашиваем
// платёж по его id через GET /v3/payments/{id} с нашим секретным ключом:
// подделать такой ответ без секретного ключа магазина невозможно. Проверка
// IP-адреса - дополнительный, не основной, слой защиты.
export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  if (!isTrustedYookassaIp(clientIp)) {
    console.warn(`[yookassa] Уведомление с недоверенного IP: ${clientIp}`);
  }

  let body: { event?: string; object?: { id?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const paymentId = body.object?.id;
  if (!paymentId) {
    return NextResponse.json({ ok: true });
  }

  let payment;
  try {
    payment = await getYookassaPayment(paymentId);
  } catch (error) {
    console.error("[yookassa] Не удалось перепроверить платёж", paymentId, error);
    // Отдаём 500, чтобы ЮKassa повторила уведомление позже - возможно, временная сетевая проблема.
    return NextResponse.json({ error: "failed to verify payment" }, { status: 500 });
  }

  const orderNumber = payment.metadata?.order_id;
  if (!orderNumber) {
    return NextResponse.json({ ok: true });
  }

  const order = await prisma.order.findUnique({ where: { number: orderNumber } });
  if (!order) {
    console.warn(`[yookassa] Заказ по order_id=${orderNumber} не найден`);
    return NextResponse.json({ ok: true });
  }

  // payment.id может отличаться от order.paymentOperationId, если пользователь
  // создавал несколько попыток оплаты - учитываем статус только последней попытки.
  if (payment.id !== order.paymentOperationId) {
    return NextResponse.json({ ok: true });
  }

  const updated = await syncYookassaOrderStatus(order);
  if (updated.paymentStatus === "PAID" && order.paymentStatus !== "PAID") {
    console.log(`[yookassa] Заказ №${orderNumber} оплачен: ${payment.amount.value} ${payment.amount.currency}, payment_id=${payment.id}`);
  }

  return NextResponse.json({ ok: true });
}
