import type { Order } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isMoyskladConfigured } from "@/lib/moysklad";
import { createDemandForOrder, type DemandPositionInput } from "@/lib/moysklad-orders";
import { refreshCatalogProductsAfterOrder } from "@/lib/catalog-sync";

type StoredOrderItem = { id?: string; name?: string; price?: number; quantity?: number };

/**
 * Списывает товары заказа со склада в МойСклад (создаёт документ "Отгрузка")
 * и записывает результат в сам заказ (moyskladSyncStatus/moyskladDemandId/
 * moyskladSyncError) - только для видимости в админке. Ошибка здесь НИКОГДА
 * не должна ронять оформление заказа на сайте: наличие уже было проверено
 * непосредственно перед созданием заказа (см. checkStockAvailability в
 * src/app/api/orders/route.ts), а сам факт заказа на сайте важнее, чем то,
 * успело ли МойСклад в этот момент принять запрос.
 */
export async function syncOrderToMoysklad(order: Order): Promise<void> {
  if (!isMoyskladConfigured()) {
    await prisma.order.update({
      where: { id: order.id },
      data: { moyskladSyncStatus: "SKIPPED" },
    });
    return;
  }

  const rawItems = Array.isArray(order.items) ? (order.items as StoredOrderItem[]) : [];
  const requestedPositions = rawItems
    .filter((item) => item.id && item.quantity)
    .map((item) => ({ productId: item.id!, quantity: item.quantity!, priceKopecks: Math.round(item.price ?? 0) }));

  if (requestedPositions.length === 0) {
    await prisma.order.update({
      where: { id: order.id },
      data: { moyskladSyncStatus: "SKIPPED", moyskladSyncError: "В заказе нет позиций с товарами МойСклад" },
    });
    return;
  }

  try {
    const catalogRows = await prisma.catalogProduct.findMany({
      where: { id: { in: requestedPositions.map((position) => position.productId) }, archived: false },
      select: { id: true, entityType: true },
    });
    const entityTypeById = new Map(catalogRows.map((row) => [row.id, row.entityType]));
    const positions: DemandPositionInput[] = requestedPositions.map((position) => {
      const entityType = entityTypeById.get(position.productId);
      if (!entityType) throw new Error(`Товар ${position.productId} отсутствует в локальном зеркале каталога`);
      return { ...position, entityType };
    });

    const demand = await createDemandForOrder({
      orderNumber: order.number,
      customerName: order.customerName ?? "Покупатель с сайта",
      phone: order.phone ?? "",
      email: order.email,
      positions,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { moyskladSyncStatus: "SYNCED", moyskladDemandId: demand.id, moyskladSyncError: null },
    });
    console.log(`[moysklad] Заказ №${order.number} списан со склада, отгрузка ${demand.id}`);

    // Остаток в МойСклад только что уменьшился - сразу обновляем эти товары в
    // локальном зеркале каталога, чтобы сайт не показывал "в наличии" то, что
    // уже разобрали, не дожидаясь планового синка.
    await refreshCatalogProductsAfterOrder(positions.map((position) => position.productId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error(`[moysklad] Не удалось списать заказ №${order.number} со склада:`, message);
    await prisma.order.update({
      where: { id: order.id },
      data: { moyskladSyncStatus: "FAILED", moyskladSyncError: message.slice(0, 500) },
    });
  }
}
