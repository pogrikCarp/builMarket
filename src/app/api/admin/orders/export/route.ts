import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function csvEscape(value: unknown) {
  const str = value == null ? "" : String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });

  const header = ["Номер", "Дата", "Статус", "Сумма", "Клиент", "Email", "Телефон"];
  const rows = orders.map((o) => [
    o.number,
    o.createdAt.toISOString(),
    o.status,
    o.total.toString(),
    o.user?.name ?? "",
    o.user?.email ?? "",
    o.user?.phone ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(";")).join("\n");
  const bom = "\uFEFF";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${Date.now()}.csv"`,
    },
  });
}
