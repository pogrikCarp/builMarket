import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyYoomoneyNotification, type YoomoneyNotification } from "@/lib/yoomoney";

// HTTP-уведомление от ЮMoney о входящем платеже (см. src/lib/yoomoney.ts).
// ЮMoney делает до 3 попыток доставки (сразу, через 10 минут, через час) и считает
// уведомление принятым только при ответе 200 - поэтому на любой "наш" случай
// (неизвестный label, уже обработанное уведомление, неподдерживаемый тип) отвечаем
// 200, чтобы ЮMoney не спамила повторами и не отключила уведомления из-за "недоступности"
// сервера. 400 отдаём ТОЛЬКО при неверной подписи - это единственный признак того,
// что запрос не от ЮMoney.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody)) as Record<string, string>;

  let signatureValid: boolean;
  try {
    signatureValid = verifyYoomoneyNotification(params);
  } catch (error) {
    console.error("[yoomoney] Ошибка проверки подписи (проверьте YOOMONEY_NOTIFICATION_SECRET в .env):", error);
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  if (!signatureValid) {
    console.warn("[yoomoney] Уведомление с неверной подписью отклонено", { label: params.label });
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const notification = params as unknown as YoomoneyNotification;

  if (notification.notification_type !== "p2p-incoming" && notification.notification_type !== "card-incoming") {
    // Подпись верна, но тип нам не интересен - подтверждаем приём, чтобы не было повторов.
    return NextResponse.json({ ok: true });
  }

  const orderNumber = notification.label;
  const amount = Number(notification.amount);

  if (!orderNumber || !Number.isFinite(amount)) {
    console.warn("[yoomoney] Уведомление без label или с некорректной суммой", notification);
    return NextResponse.json({ ok: true });
  }

  const order = await prisma.order.findUnique({ where: { number: orderNumber } });
  if (!order) {
    console.warn(`[yoomoney] Заказ по label=${orderNumber} не найден - уведомление проигнорировано`);
    return NextResponse.json({ ok: true });
  }

  if (order.paymentStatus === "PAID") {
    // Уже обработано (в т.ч. повторная доставка того же уведомления) - ничего не делаем.
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        paymentProvider: "yoomoney",
        paymentOperationId: notification.operation_id,
        paymentAmount: amount,
        paidAt: new Date(),
      },
    });
  } catch (error) {
    // P2002 - operation_id уже записан за другим заказом (повторная доставка
    // уведомления ЮMoney) - это не ошибка, просто игнорируем повтор.
    const isDuplicate = typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
    if (!isDuplicate) {
      console.error("[yoomoney] Не удалось сохранить статус оплаты заказа", orderNumber, error);
      return NextResponse.json({ ok: true });
    }
  }

  if (amount + 0.01 < Number(order.total)) {
    console.warn(
      `[yoomoney] Заказ №${orderNumber}: получено ${amount} ₽, ожидалось ${order.total} ₽ (возможно, комиссия удержана из суммы) - проверьте вручную`
    );
  }

  console.log(`[yoomoney] Заказ №${orderNumber} оплачен: ${amount} ₽, operation_id=${notification.operation_id}`);
  return NextResponse.json({ ok: true });
}
