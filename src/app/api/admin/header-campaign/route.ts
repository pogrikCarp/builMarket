import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isHeaderTheme } from "@/lib/header-campaign";
import { getHeaderCampaignState } from "@/lib/header-campaign-server";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getHeaderCampaignState(), { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || !isHeaderTheme(body.theme)) return NextResponse.json({ error: "Выберите оформление шапки" }, { status: 400 });
  const { theme, customImage, customTitle, buttonLabel } = body;
  if (typeof customTitle !== "string" || !customTitle.trim() || customTitle.length > 60 || typeof buttonLabel !== "string" || buttonLabel.length > 32) {
    return NextResponse.json({ error: "Название — до 60 символов, текст кнопки — до 32" }, { status: 400 });
  }
  if (customImage !== null && (typeof customImage !== "string" || !/^\/uploads\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(png|webp|jpe?g|gif)$/i.test(customImage))) {
    return NextResponse.json({ error: "Выберите файл через загрузку наклейки" }, { status: 400 });
  }
  if (theme === "custom" && !customImage) return NextResponse.json({ error: "Загрузите свою наклейку" }, { status: 400 });
  const data = { theme, customImage, customTitle: customTitle.trim(), buttonLabel: buttonLabel.trim() };
  await prisma.headerCampaign.upsert({ where: { id: "main" }, create: { id: "main", ...data }, update: data });
  return NextResponse.json(await getHeaderCampaignState());
}
