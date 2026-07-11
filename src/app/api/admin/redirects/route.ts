import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

function normalizePath(path: string) {
  const trimmed = String(path).trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const redirects = await prisma.redirect.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ redirects });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { fromPath, toPath, type, active } = body ?? {};

  if (!fromPath || !toPath) {
    return NextResponse.json({ error: "fromPath и toPath обязательны" }, { status: 400 });
  }

  const from = normalizePath(fromPath);
  const to = normalizePath(toPath);

  if (from === to) {
    return NextResponse.json({ error: "fromPath и toPath не должны совпадать" }, { status: 400 });
  }

  const existing = await prisma.redirect.findUnique({ where: { fromPath: from } });
  if (existing) {
    return NextResponse.json({ error: "Редирект с таким исходным адресом уже существует" }, { status: 409 });
  }

  const redirect = await prisma.redirect.create({
    data: {
      fromPath: from,
      toPath: to,
      type: type === "TEMPORARY" ? "TEMPORARY" : "PERMANENT",
      active: active ?? true,
    },
  });

  return NextResponse.json({ redirect }, { status: 201 });
}
