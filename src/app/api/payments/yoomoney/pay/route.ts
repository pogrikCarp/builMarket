import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";
import { buildQuickpayParams, isYoomoneyConfigured, YOOMONEY_QUICKPAY_URL, type QuickpayPaymentType } from "@/lib/yoomoney";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Промежуточная страница, которая автоматически отправляет POST-форму на ЮMoney
// (см. src/lib/yoomoney.ts) - именно так задокументирован приём платежей ЮMoney,
// прямого GET-редиректа с параметрами официально нет. Номер кошелька ЮMoney не
// является секретом (он и так виден на странице оплаты), поэтому строим форму на
// сервере и сразу открываем её пользователю.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("order");
  const method = searchParams.get("method") === "PC" ? "PC" : "AC";

  if (!isYoomoneyConfigured()) {
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

  const params = buildQuickpayParams({
    amountRub: Number(order.total),
    orderNumber: order.number,
    paymentType: method as QuickpayPaymentType,
    successUrl: `${SITE_URL}/order?paid=${encodeURIComponent(orderNumber)}`,
  });

  const inputs = Object.entries(params)
    .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}" />`)
    .join("\n    ");

  const html = `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Переход к оплате...</title>
  </head>
  <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
    <form id="yoomoney-form" method="POST" action="${YOOMONEY_QUICKPAY_URL}">
    ${inputs}
      <noscript><button type="submit">Перейти к оплате</button></noscript>
    </form>
    <p>Переходим к оплате...</p>
    <script>document.getElementById("yoomoney-form").submit();</script>
  </body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
