import type { Order } from "@prisma/client";
import { escapeHtml, getMailTransporter, isMailConfigured } from "@/lib/mailer";

function formatMoney(kopecksOrRubles: number, alreadyInRubles = false): string {
  const value = alreadyInRubles ? kopecksOrRubles : kopecksOrRubles / 100;
  return value.toLocaleString("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
}

const DELIVERY_LABELS: Record<string, string> = { pickup: "Самовывоз", delivery: "Доставка" };
const PAYMENT_LABELS: Record<string, string> = { cash: "Наличными/картой при получении", card: "Картой онлайн (ЮKassa)", yookassa: "Онлайн-оплата (ЮKassa)" };

type StoredOrderItem = { name?: string; price?: number; quantity?: number };

function renderItemsText(order: Order): string {
  const items = Array.isArray(order.items) ? (order.items as StoredOrderItem[]) : [];
  return items
    .map((item) => `  • ${item.name ?? "Товар"} — ${item.quantity ?? 0} шт. × ${formatMoney(item.price ?? 0)}`)
    .join("\n");
}

function renderItemsHtml(order: Order): string {
  const items = Array.isArray(order.items) ? (order.items as StoredOrderItem[]) : [];
  return items
    .map(
      (item) =>
        `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee;">${escapeHtml(item.name ?? "Товар")}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity ?? 0}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">${formatMoney(item.price ?? 0)}</td></tr>`
    )
    .join("");
}

/**
 * Уведомление менеджерам ДомСтрой о новом заказе на сайте - дублирует данные,
 * уже видимые в /admin/orders, чтобы не приходилось постоянно проверять
 * админку вручную. Вызывается сразу после создания заказа в БД (см.
 * src/app/api/orders/route.ts), не блокирует ответ покупателю - при сбое
 * отправки заказ всё равно считается оформленным.
 */
export async function sendOrderCreatedNotification(order: Order): Promise<void> {
  if (!isMailConfigured()) {
    console.warn("[order-notify] SMTP не настроен - письмо о заказе не отправлено");
    return;
  }

  const transporter = getMailTransporter();
  if (!transporter) return;

  const to = process.env.ORDER_EMAIL_TO || process.env.CALLBACK_EMAIL_TO || "info@marketdomstroy.ru";
  const from = process.env.CALLBACK_EMAIL_FROM || `"Сайт ДомСтрой" <${process.env.SMTP_USER}>`;
  const createdAt = order.createdAt.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
  const customerName = order.customerName ?? "Гость";
  const phone = order.phone ?? "не указан";
  const deliveryType = order.deliveryType ?? "pickup";
  const paymentType = order.paymentType ?? "cash";
  const deliveryLabel = DELIVERY_LABELS[deliveryType] ?? deliveryType;
  const paymentLabel = PAYMENT_LABELS[paymentType] ?? paymentType;

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Новый заказ №${order.number} на ${formatMoney(Number(order.total), true)}`,
      text: [
        `Новый заказ №${order.number} с сайта marketdomstroy.ru`,
        "",
        `Дата: ${createdAt}`,
        `Покупатель: ${customerName}`,
        `Телефон: ${phone}`,
        order.email ? `Email: ${order.email}` : "",
        `Способ получения: ${deliveryLabel}`,
        order.address ? `Адрес: ${order.address}` : "",
        `Оплата: ${paymentLabel}`,
        order.comment ? `Комментарий: ${order.comment}` : "",
        "",
        "Состав заказа:",
        renderItemsText(order),
        "",
        `Итого: ${formatMoney(Number(order.total), true)}`,
      ]
        .filter(Boolean)
        .join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #1e293b;">
          <h2 style="margin: 0 0 12px;">Новый заказ №${escapeHtml(order.number)}</h2>
          <p><strong>Дата:</strong> ${escapeHtml(createdAt)}</p>
          <p><strong>Покупатель:</strong> ${escapeHtml(customerName)}</p>
          <p><strong>Телефон:</strong> ${escapeHtml(phone)}</p>
          ${order.email ? `<p><strong>Email:</strong> ${escapeHtml(order.email)}</p>` : ""}
          <p><strong>Способ получения:</strong> ${escapeHtml(deliveryLabel)}</p>
          ${order.address ? `<p><strong>Адрес:</strong> ${escapeHtml(order.address)}</p>` : ""}
          <p><strong>Оплата:</strong> ${escapeHtml(paymentLabel)}</p>
          ${order.comment ? `<p><strong>Комментарий:</strong> ${escapeHtml(order.comment)}</p>` : ""}
          <table style="border-collapse:collapse;margin-top:12px;width:100%;max-width:520px;">
            <thead><tr><th style="text-align:left;padding:4px 8px;">Товар</th><th style="padding:4px 8px;">Кол-во</th><th style="text-align:right;padding:4px 8px;">Цена</th></tr></thead>
            <tbody>${renderItemsHtml(order)}</tbody>
          </table>
          <p style="margin-top:12px;"><strong>Итого: ${formatMoney(Number(order.total), true)}</strong></p>
        </div>
      `,
    });
  } catch (error) {
    console.error(`[order-notify] Не удалось отправить письмо о заказе №${order.number}`, error);
  }

  // Если покупатель оставил свой email — отправляем ему отдельное подтверждение.
  if (order.email) {
    try {
      await transporter.sendMail({
        from,
        to: order.email,
        subject: `Ваш заказ №${order.number} принят - ДомСтрой`,
        text: [
          `Здравствуйте, ${customerName}!`,
          "",
          `Ваш заказ №${order.number} принят в обработку.`,
          "",
          "Состав заказа:",
          renderItemsText(order),
          "",
          `Итого: ${formatMoney(Number(order.total), true)}`,
          `Способ получения: ${deliveryLabel}`,
          "",
          "Мы свяжемся с вами по указанному телефону для подтверждения заказа.",
          "Если у вас есть вопросы - звоните +7 916 004-55-22.",
        ]
          .filter(Boolean)
          .join("\n"),
        html: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #1e293b;">
            <h2 style="margin: 0 0 12px;">Спасибо за заказ, ${escapeHtml(customerName)}!</h2>
            <p>Ваш заказ <strong>№${escapeHtml(order.number)}</strong> принят в обработку.</p>
            <table style="border-collapse:collapse;margin-top:12px;width:100%;max-width:520px;">
              <thead><tr><th style="text-align:left;padding:4px 8px;">Товар</th><th style="padding:4px 8px;">Кол-во</th><th style="text-align:right;padding:4px 8px;">Цена</th></tr></thead>
              <tbody>${renderItemsHtml(order)}</tbody>
            </table>
            <p style="margin-top:12px;"><strong>Итого: ${formatMoney(Number(order.total), true)}</strong></p>
            <p><strong>Способ получения:</strong> ${escapeHtml(deliveryLabel)}</p>
            <p style="margin-top:16px;">Мы свяжемся с вами по указанному телефону для подтверждения заказа.<br />Если у вас есть вопросы — звоните <a href="tel:+79160045522">+7 916 004-55-22</a>.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error(`[order-notify] Не удалось отправить подтверждение покупателю по заказу №${order.number}`, error);
    }
  }
}

/**
 * Отдельное короткое уведомление о том, что заказ реально ОПЛАЧЕН онлайн через
 * ЮKassa (в отличие от sendOrderCreatedNotification, которое уходит сразу при
 * оформлении заказа, ещё до оплаты). Вызывается из src/lib/order-payment.ts в
 * момент, когда статус меняется на PAID.
 */
export async function sendOrderPaidNotification(order: Order): Promise<void> {
  if (!isMailConfigured()) return;
  const transporter = getMailTransporter();
  if (!transporter) return;

  const to = process.env.ORDER_EMAIL_TO || process.env.CALLBACK_EMAIL_TO || "info@marketdomstroy.ru";
  const from = process.env.CALLBACK_EMAIL_FROM || `"Сайт ДомСтрой" <${process.env.SMTP_USER}>`;
  const customerName = order.customerName ?? "Гость";
  const phone = order.phone ?? "не указан";
  const amountLabel = formatMoney(Number(order.paymentAmount ?? order.total), true);

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Оплачен заказ №${order.number} на ${amountLabel}`,
      text: `Заказ №${order.number} успешно оплачен онлайн через ЮKassa на сумму ${amountLabel}. Покупатель: ${customerName}, тел. ${phone}.`,
      html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #1e293b;"><p>Заказ <strong>№${escapeHtml(order.number)}</strong> успешно оплачен онлайн через ЮKassa на сумму <strong>${amountLabel}</strong>.</p><p>Покупатель: ${escapeHtml(customerName)}, тел. ${escapeHtml(phone)}.</p></div>`,
    });
  } catch (error) {
    console.error(`[order-notify] Не удалось отправить письмо об оплате заказа №${order.number}`, error);
  }
}
