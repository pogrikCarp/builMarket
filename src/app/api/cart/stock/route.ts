import { NextResponse } from "next/server";
import { getAssortmentByIds } from "@/lib/moysklad";

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

  try {
    const items = await getAssortmentByIds(ids);
    const stock: Record<string, number> = {};
    for (const id of ids) {
      // Товара нет в ответе МойСклад (удалён/снят с продажи) - это не "не
      // удалось проверить", а реальное "нет в наличии", поэтому явно 0, а не
      // пропуск записи - иначе корзина посчитала бы такой товар доступным.
      stock[id] = items.get(id)?.quantity ?? 0;
    }
    return NextResponse.json({ stock });
  } catch {
    // МойСклад недоступен целиком (сеть, лимиты) - отдаём пустой ответ,
    // клиент трактует отсутствие записей как "не удалось проверить" и не
    // блокирует UI (см. src/app/basket/BasketClient.tsx).
    return NextResponse.json({ stock: {} });
  }
}
