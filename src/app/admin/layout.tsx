import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { AdminSidebar } from "./AdminSidebar";

// Админ-панель не должна индексироваться (дублирует правило Disallow в robots.ts).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/personal");
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="border-b border-slate-100 bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="shrink-0">
            <Image src="/logo.png" alt="ДомСтрой" width={150} height={62} className="h-12 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4 text-sm text-amber-100">
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
              Админ-панель
            </span>
            <Link href="/personal" className="text-slate-300 transition hover:text-white">
              В личный кабинет
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <AdminSidebar />
          <div className="flex-grow overflow-x-auto">{children}</div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-sm text-slate-400">
          © {new Date().getFullYear()} ДомСтрой — админ-панель
        </div>
      </footer>
    </div>
  );
}
