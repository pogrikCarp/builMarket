import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { Sidebar } from "./Sidebar";

export default async function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/personal");
  }

  const displayName = session.user.name || session.user.email || "Гость";

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="shrink-0">
            <Image src="/logo.png" alt="ДомСтрой" width={120} height={50} className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>Привет, {displayName}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <Sidebar />
          <div className="flex-grow">{children}</div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-sm text-slate-400">
          © {new Date().getFullYear()} ДомСтрой — строительная база
        </div>
      </footer>
    </div>
  );
}
