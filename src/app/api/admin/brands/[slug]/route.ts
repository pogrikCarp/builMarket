import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getManagedBrands } from "@/lib/brand-profiles";
import { parseBrandInput } from "@/lib/brand-profile-input";

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { slug } = await params;
  if (!(await getManagedBrands()).some(brand => brand.slug === slug)) return NextResponse.json({ error: "Бренд не найден" }, { status: 404 });
  let data;
  try { data = parseBrandInput(await request.json()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Проверьте данные бренда" }, { status: 400 }); }
  const brand = await prisma.brandProfile.upsert({ where: { slug }, create: { slug, ...data }, update: data });
  return NextResponse.json({ brand });
}
