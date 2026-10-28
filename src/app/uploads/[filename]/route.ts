import { readFile } from "node:fs/promises";
import path from "node:path";
import { uploadsDirectory } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// Next.js indexes public files at startup. Serve later uploads at request time
// as well, so local development and direct next start behave like nginx.
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const contentType = CONTENT_TYPES[path.extname(filename).toLowerCase()];
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(filename) || !contentType) {
    return new Response(null, { status: 404 });
  }
  try {
    const file = await readFile(path.join(uploadsDirectory(), filename));
    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response(null, { status: 404 });
    console.error("[uploads] Failed to read image:", error);
    return new Response(null, { status: 500 });
  }
}
