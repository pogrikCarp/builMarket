import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getManagedBrands } from "@/lib/brand-profiles";
import { brandSlug, parseBrandInput, validBrandSlug } from "@/lib/brand-profile-input";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ brands: await getManagedBrands() });
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    const data = parseBrandInput(body);
    const slug = String(body.slug || brandSlug(data.name));
    if (!validBrandSlug(slug)) return NextResponse.json({ error: "Адрес: латинские буквы, цифры и дефисы, до 80 символов" }, { status: 400 });
    if ((await getManagedBrands()).some(brand => brand.slug === slug)) return NextResponse.json({ error: "Этот адрес бренда уже занят" }, { status: 409 });
    const brand = await prisma.brandProfile.create({ data: { slug, ...data } });
    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ error: "Этот адрес бренда уже занят" }, { status: 409 });
    if (error && typeof error === "object" && "code" in error) throw error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Проверьте данные бренда" }, { status: 400 });
  }
}
