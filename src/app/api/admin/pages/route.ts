import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pages = await prisma.staticPage.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ pages });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { slug, title, content, published, seoTitle, seoDescription } = body ?? {};

  if (!slug || !title) {
    return NextResponse.json({ error: "slug и title обязательны" }, { status: 400 });
  }

  const normalizedSlug = String(slug)
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/[^a-z0-9\-\/]+/g, "-");

  const existing = await prisma.staticPage.findUnique({ where: { slug: normalizedSlug } });
  if (existing) {
    return NextResponse.json({ error: "Страница с таким slug уже существует" }, { status: 409 });
  }

  const page = await prisma.staticPage.create({
    data: {
      slug: normalizedSlug,
      title,
      content: content ?? "",
      published: published ?? true,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
    },
  });

  return NextResponse.json({ page }, { status: 201 });
}
