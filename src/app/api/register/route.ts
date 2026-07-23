import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть не менее 6 символов" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase();
    const normalizedPhone = phone ? String(phone).replace(/\D/g, "") : null;
    const existingByEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const existingByPhone = normalizedPhone
      ? await prisma.user.findFirst({ where: { phone: normalizedPhone } })
      : null;

    if (existingByEmail && existingByPhone && existingByEmail.id !== existingByPhone.id) {
      return NextResponse.json({ error: "Email и телефон уже принадлежат разным пользователям" }, { status: 409 });
    }

    const existing = existingByPhone ?? existingByEmail;
    const passwordHash = await bcrypt.hash(String(password), 10);

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "Пользователь с такими данными уже зарегистрирован" },
        { status: 409 }
      );
    }

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: name ? String(name) : existing.name,
            email: normalizedEmail,
            phone: normalizedPhone || existing.phone,
            passwordHash,
          },
          select: { id: true, email: true, name: true },
        })
      : await prisma.user.create({
          data: {
            name: name ? String(name) : null,
            email: normalizedEmail,
            phone: normalizedPhone,
            passwordHash,
          },
          select: { id: true, email: true, name: true },
        });

    return NextResponse.json({ user, claimedGuestAccount: Boolean(existing) }, { status: existing ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
