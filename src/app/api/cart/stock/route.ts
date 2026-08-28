import { NextResponse } from "next/server";
import { getProductById } from "@/lib/moysklad";

// Публичный эндпоинт актуальных остатков для списка товаров - используется
// страницами корзины и оформления заказа, чтобы показать реальное наличие
// прямо перед покупкой (данные каталога на странице могли устареть за то
// время, что товар лежал в корзине). Отдаёт только id -> количество, никаких
// приватных данных.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids") ?? "";
  const ids = Array.from(new Set(idsParam.split(",").map((id) => id.trim()).filter(Boolean))).slice(0, 100);

  if (ids.length === 0) {
    return NextResponse.json({ stock: {} });
  }

  const results = await Promise.allSettled(ids.map((id) => getProductById(id)));
  const stock: Record<string, number> = {};

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      stock[ids[index]] = result.value.quantity ?? 0;
    }
    // Товар не найден/МойСклад недоступен - просто не включаем его в ответ,
    // клиент трактует отсутствие записи как "не удалось проверить" и не блокирует UI.
  });

  return NextResponse.json({ stock });
}
