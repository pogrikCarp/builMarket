import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { LOOKBOOKS } from "@/lib/lookbooks";

export default function LookbooksPage() {
  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-900">
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fff7e8] via-white to-[#f7f1e6]" />
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
            <Link href="/" className="text-xs font-semibold uppercase tracking-[0.45em] text-amber-500">
              ← ДомСтрой
            </Link>
            <p className="mt-8 text-sm uppercase tracking-[0.35em] text-amber-600">lookbooks</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">Готовые наборы материалов</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Подобрали комплекты материалов под конкретные задачи — от сайдинга до подвесных потолков.
            </p>
          </div>
        </section>

        <section className="pb-12 sm:pb-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {LOOKBOOKS.map((lookbook) => (
                <Link
                  key={lookbook.slug}
                  href={`/lookbooks/${lookbook.slug}`}
                  className="group relative overflow-hidden rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.18)] transition hover:-translate-y-1"
                  style={{
                    backgroundImage: `url(${lookbook.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: lookbook.imagePosition ?? "center",
                    aspectRatio: "0.72",
                    minHeight: "320px",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition group-hover:from-black/65" />
                  <div className="absolute inset-0 flex flex-col justify-end p-5 text-white sm:p-7">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/70 sm:text-xs sm:tracking-[0.4em]">{lookbook.accent}</p>
                    <h3 className="mt-2 text-xl font-semibold leading-snug sm:text-2xl">{lookbook.title}</h3>
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
