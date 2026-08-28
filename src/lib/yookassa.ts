import { randomUUID } from "node:crypto";

// Интеграция с API ЮKassa (https://yookassa.ru/developers/api) - REST API v3,
// аутентификация HTTP Basic (shopId:secretKey), подтверждение платежа по
// сценарию Redirect. Не путать с ЮMoney (yoomoney.ru) - это другой сервис.
const API_BASE = "https://api.yookassa.ru/v3";

function getCredentials() {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) throw new Error("YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY is not set");
  return { shopId, secretKey };
}

export function isYookassaConfigured() {
  return Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY);
}

// Чек 54-ФЗ нужен только если в личном кабинете ЮKassa подключена онлайн-касса
// (сервис "Чеки"). Если она не подключена, а мы всё равно передадим поле receipt,
// ЮKassa может отклонить создание платежа ошибкой вида "касса не настроена" - поэтому
// это отдельный флаг, включаемый явно после проверки в личном кабинете ЮKassa
// (Настройки → Чеки), а не включённый по умолчанию.
export function isYookassaReceiptEnabled() {
  return process.env.YOOKASSA_SEND_RECEIPTS === "true";
}

function authHeader() {
  const { shopId, secretKey } = getCredentials();
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

export type YookassaPayment = {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: { value: string; currency: string };
  metadata?: Record<string, string>;
  confirmation?: { type: string; confirmation_url?: string };
};

export type ReceiptItem = { description: string; quantity: number; amountRub: number };

export async function createYookassaPayment(options: {
  amountRub: number;
  orderNumber: string;
  returnUrl: string;
  description: string;
  // Чек 54-ФЗ - собирается и отправляется только если явно включено через
  // isYookassaReceiptEnabled() (см. комментарий там). Нужен email или телефон
  // покупателя (хотя бы один) - иначе ЮKassa не примет чек.
  receiptEmail?: string | null;
  receiptPhone?: string | null;
  receiptItems?: ReceiptItem[];
}): Promise<YookassaPayment> {
  const receipt =
    options.receiptItems?.length && (options.receiptEmail || options.receiptPhone)
      ? {
          customer: {
            ...(options.receiptEmail ? { email: options.receiptEmail } : {}),
            ...(options.receiptPhone ? { phone: options.receiptPhone } : {}),
          },
          items: options.receiptItems.map((item) => ({
            description: item.description.slice(0, 128),
            quantity: item.quantity.toFixed(2),
            amount: { value: item.amountRub.toFixed(2), currency: "RUB" },
            vat_code: 1,
            payment_subject: "commodity",
            payment_mode: "full_payment",
          })),
        }
      : undefined;

  const response = await fetch(`${API_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": randomUUID(),
    },
    body: JSON.stringify({
      amount: { value: options.amountRub.toFixed(2), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: options.returnUrl },
      description: options.description,
      metadata: { order_id: options.orderNumber },
      ...(receipt ? { receipt } : {}),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`YooKassa create payment failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return data as YookassaPayment;
}

export async function getYookassaPayment(paymentId: string): Promise<YookassaPayment> {
  const response = await fetch(`${API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`YooKassa get payment failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return data as YookassaPayment;
}

// Официальный список IP-адресов, с которых ЮKassa присылает уведомления
// (https://yookassa.ru/developers/using-api/webhooks#ip). Используется как
// дополнительная проверка - основная защита - повторный запрос статуса
// платежа через getYookassaPayment() с нашим секретным ключом, который
// подделать нельзя.
const TRUSTED_IPV4_RANGES: [string, number][] = [
  ["185.71.76.0", 27],
  ["185.71.77.0", 27],
  ["77.75.153.0", 25],
  ["77.75.154.128", 25],
];
const TRUSTED_IPV4_HOSTS = new Set(["77.75.156.11", "77.75.156.35"]);

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return null;
  return parts.reduce((acc, part) => acc * 256 + part, 0);
}

export function isTrustedYookassaIp(ip: string | null): boolean {
  if (!ip) return false;
  const cleanIp = ip.trim();
  if (cleanIp.startsWith("2a02:5180:")) return true;
  if (TRUSTED_IPV4_HOSTS.has(cleanIp)) return true;

  const ipInt = ipv4ToInt(cleanIp);
  if (ipInt == null) return false;

  return TRUSTED_IPV4_RANGES.some(([base, prefix]) => {
    const baseInt = ipv4ToInt(base);
    if (baseInt == null) return false;
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    return (ipInt & mask) === (baseInt & mask);
  });
}
