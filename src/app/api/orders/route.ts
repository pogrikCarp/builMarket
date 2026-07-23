import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function normalizePhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits : null;
}

function normalizeEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  return email && email.includes("@") ? email : null;
}

function makeOrderNumber() {
  return `${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;
}

type OrderItemSnapshot = {
  id: string;
  name: string;
  article: string | null;
  code: string | null;
  price: number;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    const name = String(body?.name ?? "").trim();
    const phone = normalizePhone(body?.phone);
    const email = normalizeEmail(body?.email);

    if (!name || !phone || items.length === 0) {
      return NextResponse.json({ error: "Укажите имя, телефон и добавьте товары в заказ" }, { status: 400 });
    }

    const normalizedItems: OrderItemSnapshot[] = items
      .map((item: Record<string, unknown>): OrderItemSnapshot => {
        const price = Number(item.price ?? 0);
        const quantity = Math.floor(Number(item.quantity ?? 0));
        return {
          id: String(item.id ?? ""),
          name: String(item.name ?? "").trim(),
          article: item.article ? String(item.article) : null,
          code: item.code ? String(item.code) : null,
          price: Number.isFinite(price) && price >= 0 ? Math.round(price) : 0,
          quantity: Number.isFinite(quantity) && quantity > 0 ? Math.min(quantity, 10000) : 0,
        };
      })
      .filter((item: OrderItemSnapshot) => item.id && item.name && item.quantity > 0);

    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: "В заказе нет корректных товаров" }, { status: 400 });
    }

    const totalKopecks = normalizedItems.reduce((sum: number, item: OrderItemSnapshot) => sum + item.price * item.quantity, 0);
    const session = await auth();
    const sessionUserId = session?.user?.id;
    let accountCreated = false;

    const order = await prisma.$transaction(async (tx) => {
      let user = sessionUserId ? await tx.user.findUnique({ where: { id: sessionUserId } }) : null;

      if (!user) {
        user = await tx.user.findFirst({ where: { phone } });
      }

      if (!user && email) {
        user = await tx.user.findUnique({ where: { email } });
      }

      if (!user) {
        const accountEmail = email ?? `guest-${phone}@guest.domstroy.local`;
        user = await tx.user.create({
          data: {
            name,
            email: accountEmail,
            phone,
          },
        });
        accountCreated = true;
      } else {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            name: user.name || name,
            phone: user.phone || phone,
          },
        });
      }

      let number = makeOrderNumber();
      while (await tx.order.findUnique({ where: { number } })) {
        number = makeOrderNumber();
      }

      const addressParts = [body?.city, body?.street, body?.house, body?.flat]
        .map((part) => String(part ?? "").trim())
        .filter(Boolean);

      return tx.order.create({
        data: {
          userId: user.id,
          number,
          total: totalKopecks / 100,
          items: normalizedItems.map((item: OrderItemSnapshot) => ({
            ...item,
            lineTotal: item.price * item.quantity,
          })),
          customerName: name,
          phone,
          email,
          deliveryType: String(body?.deliveryType ?? "pickup"),
          paymentType: String(body?.paymentType ?? "cash"),
          address: addressParts.join(", ") || null,
          comment: String(body?.comment ?? "").trim() || null,
          company: String(body?.company ?? "").trim() || null,
          inn: String(body?.inn ?? "").trim() || null,
        },
      });
    });

    return NextResponse.json(
      {
        order: {
          id: order.id,
          number: order.number,
          status: order.status,
          createdAt: order.createdAt,
        },
        accountCreated,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать заказ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
