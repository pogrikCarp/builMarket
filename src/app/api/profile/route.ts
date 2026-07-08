import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, phone, smsPhone } = body ?? {};

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name !== undefined ? String(name) : undefined,
        phone: phone !== undefined ? String(phone) : undefined,
        smsPhone: smsPhone !== undefined ? String(smsPhone) : undefined,
      },
      select: { id: true, name: true, email: true, phone: true, smsPhone: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
