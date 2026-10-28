import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultMedia } from "@/lib/default-media";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

const BANNER_TYPES = ["BANNER", "PROMO", "HERO", "LOOKBOOK", "CERTIFICATE", "BRAND"] as const;

function normalizeType(value: unknown) {
  return BANNER_TYPES.includes(value as (typeof BANNER_TYPES)[number])
    ? (value as (typeof BANNER_TYPES)[number])
    : "BANNER";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { type, title, subtitle, image, link, active, sortOrder, startsAt, endsAt } = body ?? {};

  try {
    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(type ? { type: normalizeType(type) } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(subtitle !== undefined ? { subtitle: subtitle || null } : {}),
        ...(image !== undefined ? { image: image || null } : {}),
        ...(link !== undefined ? { link: link || null } : {}),
        ...(active !== undefined ? { active } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(startsAt !== undefined ? { startsAt: startsAt ? new Date(startsAt) : null } : {}),
        ...(endsAt !== undefined ? { endsAt: endsAt ? new Date(endsAt) : null } : {}),
      },
    });
    return NextResponse.json({ banner });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) return NextResponse.json({ ok: true });
  // Remove all overrides for this original so a legacy duplicate cannot reappear.
  if (getDefaultMedia(banner.type, banner.sortOrder)) {
    await prisma.banner.deleteMany({ where: { type: banner.type, sortOrder: banner.sortOrder } });
  } else {
    await prisma.banner.delete({ where: { id } });
  }
  return NextResponse.json({ ok: true });
}
