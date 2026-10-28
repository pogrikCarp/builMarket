import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadsDirectory } from "@/lib/uploads";

export const runtime = "nodejs";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
  }

  const extension = EXTENSIONS[file.type];
  if (!extension) {
    return NextResponse.json({ error: "Поддерживаются JPG, PNG, WEBP и GIF" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Файл пуст" }, { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Размер файла не должен превышать 8 МБ" }, { status: 400 });
  }

  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  try {
    const uploadDirectory = uploadsDirectory();
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    console.error("[admin/uploads] Failed to save image:", error);
    return NextResponse.json({ error: "Не удалось сохранить изображение. Повторите попытку." }, { status: 500 });
  }

  return NextResponse.json({ url: `/uploads/${fileName}` }, { status: 201 });
}
