import { NextResponse } from "next/server";

// Лёгкий health-check для деплой-скрипта (blue-green переключение портов на
// сервере, см. scripts/deploy.sh). Намеренно не трогает БД/МойСклад - должен
// быстро отвечать 200, пока сам Next.js-процесс жив и принимает запросы.
export function GET() {
  return NextResponse.json({ ok: true });
}
