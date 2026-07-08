import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body ?? {};

    if (!newPassword || String(newPassword).length < 6) {
      return NextResponse.json(
        { error: "Новый пароль должен быть не менее 6 символов" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    if (user.passwordHash) {
      const valid = await bcrypt.compare(String(currentPassword ?? ""), user.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Текущий пароль указан неверно" },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
