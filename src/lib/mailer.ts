import nodemailer, { type Transporter } from "nodemailer";

// Общий SMTP-транспорт для всех исходящих писем сайта (обратный звонок,
// уведомления о заказах и т.д.) - настройки задаются один раз через
// SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_SECURE в .env на сервере.
let cachedTransporter: Transporter | null = null;

export function getMailTransporter(): Transporter | null {
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

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
