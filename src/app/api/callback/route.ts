import { NextResponse } from "next/server";
import nodemailer, { type Transporter } from "nodemailer";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const requestLog = new Map<string, number[]>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

function stripControlChars(value: string): string {
  return value.replace(/[\r\n\t\0]/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SUSPICIOUS_PATTERN = /[\r\n]|bcc\s*:|cc\s*:|content-type\s*:|mime-version\s*:|<script/i;

function isSafeString(value: string): boolean {
  return !SUSPICIOUS_PATTERN.test(value);
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });
  return cachedTransporter;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }

    const honeypot = String((body as Record<string, unknown>).website ?? "");
    if (honeypot.trim().length > 0) {
      return NextResponse.json({ ok: true });
    }

    const rawName = String((body as Record<string, unknown>).name ?? "");
    const name = stripControlChars(rawName).slice(0, 100);
    if (!name || name.length < 2 || !isSafeString(rawName)) {
      return NextResponse.json({ error: "Укажите корректное имя" }, { status: 400 });
    }

    const phoneDigits = String((body as Record<string, unknown>).phone ?? "").replace(/\D/g, "");
    if (!/^7\d{10}$/.test(phoneDigits)) {
      return NextResponse.json({ error: "Укажите корректный номер телефона в формате +7" }, { status: 400 });
    }
    const phone = `+${phoneDigits}`;

    const rawPage = String((body as Record<string, unknown>).page ?? "");
    const page = stripControlChars(rawPage).slice(0, 300);
    if (page && !isSafeString(rawPage)) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.error(
        "[api/callback] SMTP не настроен: заполните SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS в .env на сервере."
      );
      return NextResponse.json(
        { error: "Форма временно недоступна. Позвоните нам по телефону +7 916 004-55-22." },
        { status: 503 }
      );
    }

    const to = process.env.CALLBACK_EMAIL_TO || "info@marketdomstroy.ru";
    const from = process.env.CALLBACK_EMAIL_FROM || `"Сайт ДомСтрой" <${process.env.SMTP_USER}>`;
    const submittedAt = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });

    await transporter.sendMail({
      from,
      to,
      subject: `Заказан обратный звонок — ${name}`,
      text: [
        "Новая заявка на обратный звонок с сайта marketdomstroy.ru",
        "",
        `Имя: ${name}`,
        `Телефон: ${phone}`,
        `Дата: ${submittedAt}`,
        page ? `Страница: ${page}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #1e293b;">
          <h2 style="margin: 0 0 12px;">Новая заявка на обратный звонок</h2>
          <p><strong>Имя:</strong> ${escapeHtml(name)}</p>
          <p><strong>Телефон:</strong> ${escapeHtml(phone)}</p>
          <p><strong>Дата:</strong> ${escapeHtml(submittedAt)}</p>
          ${page ? `<p><strong>Страница:</strong> ${escapeHtml(page)}</p>` : ""}
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/callback] Не удалось отправить письмо", error);
    return NextResponse.json({ error: "Не удалось отправить заявку. Попробуйте позже." }, { status: 500 });
  }
}
