import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProductById } from "@/lib/moysklad";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

// Список товаров акции для админ-панели - вместе с именем/фото/текущей ценой из
// МойСклад (чтобы в админке сразу видно было, что выбрано), а не только "сырую"
// запись из базы.
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const promoItems = await prisma.promoItem.findMany({ orderBy: { sortOrder: "asc" } });

  const items = await Promise.allSettled(
    promoItems.map(async (promo) => {
      try {
        const product = await getProductById(promo.productId);
        return {
          ...promo,
          oldPrice: promo.oldPrice != null ? Number(promo.oldPrice) : null,
          productName: product.name,
          productPrice: product.salePrices?.[0]?.value ?? null,
          productMissing: false,
        };
      } catch {
        return {
          ...promo,
          oldPrice: promo.oldPrice != null ? Number(promo.oldPrice) : null,
          productName: null,
          productPrice: null,
          productMissing: true,
        };
      }
    })
  );

  return NextResponse.json({
    items: items.map((result) => (result.status === "fulfilled" ? result.value : null)).filter(Boolean),
  });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { productId, oldPrice, sortOrder } = body ?? {};

  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "Не выбран товар" }, { status: 400 });
  }

  // Проверяем, что товар реально существует в МойСклад, прежде чем сохранять привязку.
  try {
    await getProductById(productId);
  } catch {
    return NextResponse.json({ error: "Товар не найден в МойСклад" }, { status: 400 });
  }

  const existing = await prisma.promoItem.findUnique({ where: { productId } });
  if (existing) {
    return NextResponse.json({ error: "Этот товар уже добавлен в акции" }, { status: 400 });
  }

  const maxSortOrder = await prisma.promoItem.aggregate({ _max: { sortOrder: true } });

  const promoItem = await prisma.promoItem.create({
    data: {
      productId,
      oldPrice: oldPrice != null && oldPrice !== "" ? Number(oldPrice) : null,
      sortOrder: sortOrder != null ? Number(sortOrder) : (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ item: { ...promoItem, oldPrice: promoItem.oldPrice != null ? Number(promoItem.oldPrice) : null } }, { status: 201 });
}
