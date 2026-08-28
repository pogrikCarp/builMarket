import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { oldPrice, sortOrder, active } = body ?? {};

  try {
    const promoItem = await prisma.promoItem.update({
      where: { id },
      data: {
        ...(oldPrice !== undefined ? { oldPrice: oldPrice === "" || oldPrice === null ? null : Number(oldPrice) } : {}),
        ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
    });
    return NextResponse.json({ item: { ...promoItem, oldPrice: promoItem.oldPrice != null ? Number(promoItem.oldPrice) : null } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.promoItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
