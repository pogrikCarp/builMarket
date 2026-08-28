import { createHmac } from "node:crypto";

// Интеграция с формой приёма платежей ЮMoney (https://yoomoney.ru/docs/payment-buttons/).
// Это НЕ ЮKassa (бывшая Яндекс.Касса, отдельный сервис с другим API) - у ЮMoney своя,
// более простая схема: пользователя редиректим на страницу оплаты ЮMoney, деньги
// зачисляются на кошелёк, а сам ЮMoney уведомляет наш сервер HTTP-запросом (webhook).
export const YOOMONEY_QUICKPAY_URL = "https://yoomoney.ru/quickpay/confirm";

function getWallet() {
  const wallet = process.env.YOOMONEY_WALLET;
  if (!wallet) throw new Error("YOOMONEY_WALLET is not set");
  return wallet;
}

function getNotificationSecret() {
  const secret = process.env.YOOMONEY_NOTIFICATION_SECRET;
  if (!secret) throw new Error("YOOMONEY_NOTIFICATION_SECRET is not set");
  return secret;
}

export function isYoomoneyConfigured() {
  return Boolean(process.env.YOOMONEY_WALLET && process.env.YOOMONEY_NOTIFICATION_SECRET);
}

export type QuickpayPaymentType = "AC" | "PC";

/**
 * Параметры для авто-сабмита формы на https://yoomoney.ru/quickpay/confirm
 * (см. https://yoomoney.ru/docs/payment-buttons/using-api/forms).
 * label - номер нашего заказа (Order.number), по нему сопоставляем входящее
 * уведомление о платеже с заказом в базе.
 */
export function buildQuickpayParams(options: {
  amountRub: number;
  orderNumber: string;
  paymentType: QuickpayPaymentType;
  successUrl: string;
}): Record<string, string> {
  return {
    receiver: getWallet(),
    "quickpay-form": "button",
    paymentType: options.paymentType,
    sum: options.amountRub.toFixed(2),
    label: options.orderNumber,
    successURL: options.successUrl,
  };
}

export type YoomoneyNotification = {
  notification_type: string;
  operation_id: string;
  amount: string;
  withdraw_amount?: string;
  currency: string;
  datetime: string;
  sender: string;
  codepro: string;
  label: string;
  unaccepted?: string;
  sha1_hash?: string;
  sign?: string;
};

/**
 * Проверка подписи HTTP-уведомления ЮMoney по официальному алгоритму:
 * https://yoomoney.ru/docs/payment-buttons/using-api/notifications#security
 *
 * 1. Убрать параметр sign.
 * 2. Отсортировать оставшиеся параметры по алфавиту (A-Z).
 * 3. URL-кодировать значения (UTF-8, RFC 3986).
 * 4. Склеить как key=value через "&" (пустые значения - "key=").
 * 5. HMAC-SHA256(secret, строка), сравнить в HEX с параметром sign.
 */
export function verifyYoomoneyNotification(params: Record<string, string>): boolean {
  const sign = params.sign;
  if (!sign) return false;

  const secret = getNotificationSecret();
  const keys = Object.keys(params)
    .filter((key) => key !== "sign")
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const message = keys.map((key) => `${key}=${encodeURIComponent(params[key] ?? "")}`).join("&");

  const expected = createHmac("sha256", secret).update(message, "utf8").digest("hex");

  return timingSafeEqualHex(expected, sign.toLowerCase());
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
