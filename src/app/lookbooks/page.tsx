import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { LOOKBOOKS } from "@/lib/lookbooks";

export default function LookbooksPage() {
  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-900">
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fff7e8] via-white to-[#f7f1e6]" />
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Link href="/" className="text-xs font-semibold uppercase tracking-[0.45em] text-amber-500">
              ← ДомСтрой
            </Link>
            <p className="mt-8 text-sm uppercase tracking-[0.35em] text-amber-600">lookbooks</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">Готовые наборы материалов</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Подобрали комплекты материалов под конкретные задачи — от сайдинга до подвесных потолков.
            </p>
          </div>
        </section>

        <section className="pb-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {LOOKBOOKS.map((lookbook) => (
                <Link
                  key={lookbook.slug}
                  href={`/lookbooks/${lookbook.slug}`}
                  className="group relative overflow-hidden rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.18)] transition hover:-translate-y-1"
                  style={{
                    backgroundImage: `url(${lookbook.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    aspectRatio: "0.62",
                    minHeight: "360px",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition group-hover:from-black/65" />
                  <div className="absolute inset-0 flex flex-col justify-end p-7 text-white">
                    <p className="text-xs uppercase tracking-[0.4em] text-white/70">{lookbook.accent}</p>
                    <h3 className="mt-2 text-2xl font-semibold leading-snug">{lookbook.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
