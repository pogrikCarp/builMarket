import type { Order } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getYookassaPayment, isYookassaConfigured } from "@/lib/yookassa";

/**
 * Сверяет статус заказа с реальным статусом платежа в ЮKassa и обновляет БД,
 * если они расходятся.
 *
 * Зачем это отдельно от вебхука (src/app/api/payments/yookassa/notify/route.ts):
 * HTTP-уведомления от ЮKassa - это push-механизм "лучшего старания" (best effort).
 * Если в личном кабинете ЮKassa не настроен адрес уведомлений, письмо не дошло
 * из-за сетевой проблемы, либо покупатель вернулся на сайт раньше, чем пришёл
 * вебхук - заказ навсегда останется в статусе "ожидаем подтверждение", хотя
 * деньги по факту списаны. Поэтому эта же проверка (pull, через GET
 * /v3/payments/{id} с нашим секретным ключом) вызывается ещё и при каждом
 * запросе статуса заказа (см. src/app/api/orders/[number]/route.ts) - это
 * самовосстанавливающийся резерв, не зависящий от того, настроены ли вебхуки.
 */
export async function syncYookassaOrderStatus(order: Order): Promise<Order> {
  if (order.paymentStatus === "PAID") return order;
  if (order.paymentProvider !== "yookassa" || !order.paymentOperationId) return order;
  if (!isYookassaConfigured()) return order;

  let payment;
  try {
    payment = await getYookassaPayment(order.paymentOperationId);
  } catch (error) {
    console.error(`[yookassa] Не удалось перепроверить платёж заказа №${order.number}`, error);
    return order;
  }

  if (payment.status === "succeeded" && payment.paid) {
    return prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        paymentAmount: Number(payment.amount.value),
        paidAt: order.paidAt ?? new Date(),
      },
    });
  }

  if (payment.status === "canceled" && order.paymentStatus !== "FAILED") {
    return prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
  }

  return order;
}
