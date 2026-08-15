"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCaptchaCode(length = 5): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  }
  return code;
}

function formatRuPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits[0] === "8") digits = `7${digits.slice(1)}`;
  if (digits[0] !== "7") digits = `7${digits}`;
  digits = digits.slice(0, 11);
  const rest = digits.slice(1);

  let result = "+7";
  if (rest.length > 0) result += ` (${rest.slice(0, 3)}`;
  if (rest.length >= 3) result += ")";
  if (rest.length > 3) result += ` ${rest.slice(3, 6)}`;
  if (rest.length > 6) result += `-${rest.slice(6, 8)}`;
  if (rest.length > 8) result += `-${rest.slice(8, 10)}`;
  return result;
}

function CaptchaCanvas({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 5; i += 1) {
      ctx.strokeStyle = `rgba(100, 116, 139, ${0.2 + Math.random() * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }

    const charWidth = width / code.length;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    for (let i = 0; i < code.length; i += 1) {
      ctx.save();
      const x = charWidth * i + charWidth / 2;
      const y = height / 2 + (Math.random() * 6 - 3);
      ctx.translate(x, y);
      ctx.rotate(Math.random() * 0.5 - 0.25);
      ctx.font = "bold 22px monospace";
      const r = 20 + Math.floor(Math.random() * 40);
      const g = 30 + Math.floor(Math.random() * 40);
      const b = 55 + Math.floor(Math.random() * 40);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }

    for (let i = 0; i < 30; i += 1) {
      ctx.fillStyle = `rgba(148, 163, 184, ${Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [code]);

  return (
    <canvas
      ref={canvasRef}
      width={130}
      height={44}
      role="img"
      aria-label="Код проверки с картинки"
      className="rounded border border-slate-300 bg-slate-50"
    />
  );
}

type Status = "idle" | "submitting" | "success";

export default function CallbackModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [captchaCode, setCaptchaCode] = useState(() => generateCaptchaCode());
  const [captchaInput, setCaptchaInput] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const honeypotRef = useRef<HTMLInputElement>(null);

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());
    setCaptchaInput("");
  };

  const phoneDigits = phone.replace(/\D/g, "");
  const isPhoneValid = /^7\d{10}$/.test(phoneDigits);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Укажите имя");
      return;
    }
    if (!isPhoneValid) {
      setErrorMessage("Введите корректный номер телефона в формате +7");
      return;
    }
    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setErrorMessage("Код с картинки введён неверно");
      refreshCaptcha();
      return;
    }
    if (!agreed) {
      setErrorMessage("Необходимо согласие на обработку персональных данных");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: `+${phoneDigits}`,
          website: honeypotRef.current?.value ?? "",
          page: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Не удалось отправить заявку");
      }
      setStatus("success");
    } catch (error) {
      setStatus("idle");
      setErrorMessage(error instanceof Error ? error.message : "Не удалось отправить заявку");
      refreshCaptcha();
    }
  }

  if (status === "success") {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Закрыть"
          >
            ✕
          </button>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">Заявка отправлена</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Спасибо! Мы перезвоним вам в ближайшее время по указанному номеру.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Закрыть"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold text-slate-900">Заказать звонок</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="hidden" aria-hidden="true">
            <label>
              Оставьте это поле пустым
              <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div>
            <label className="block text-sm text-slate-700">
              Ваше имя <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700">
              Телефон <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              inputMode="tel"
              required
              value={phone}
              onChange={(e) => setPhone(formatRuPhone(e.target.value))}
              placeholder="+7 (___) ___-__-__"
              maxLength={18}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700">
              Введите текст с картинки <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="text"
                required
                maxLength={8}
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <div className="flex items-center gap-2">
                <CaptchaCanvas code={captchaCode} />
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="text-slate-400 hover:text-slate-700"
                  title="Обновить"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m0 0A7.001 7.001 0 0 1 18.418 9M4.582 9H9m11 11v-5h-.581m0 0A7.001 7.001 0 0 1 5.582 15M20.419 15H16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <button
              type="button"
              onClick={() => setAgreed((v) => !v)}
              aria-pressed={agreed}
              className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition ${
                agreed ? "bg-amber-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  agreed ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span>
              Я согласен на{" "}
              <Link
                href="/personal-data"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-amber-600 underline hover:text-amber-700"
              >
                обработку персональных данных
              </Link>
            </span>
          </div>
          {errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={!agreed || status === "submitting"}
              className="rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "submitting" ? "Отправляем…" : "Отправить"}
            </button>
            <span className="text-xs text-slate-400">* – обязательные поля</span>
          </div>
        </form>
      </div>
    </div>
  );
}
