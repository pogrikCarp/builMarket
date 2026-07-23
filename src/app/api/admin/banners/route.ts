import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ banners });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { type, title, subtitle, image, link, active, sortOrder, startsAt, endsAt } = body ?? {};

  if (!title) {
    return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
  }

  const banner = await prisma.banner.create({
    data: {
      type: normalizeType(type),
      title: String(title),
      subtitle: subtitle || null,
      image: image || null,
      link: link || null,
      active: active ?? true,
      sortOrder: Number(sortOrder ?? 0),
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
    },
  });

  return NextResponse.json({ banner }, { status: 201 });
}
