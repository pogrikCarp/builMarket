import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

type InfoLink = { label: string; href: string; description?: string };

type InfoPageProps = {
  subtitle?: string;
  title: string;
  intro?: string;
  paragraphs?: string[];
  links?: InfoLink[];
  backHref?: string;
};

export default function InfoPage({
  subtitle,
  title,
  intro,
  paragraphs = [],
  links = [],
  backHref = "/",
}: InfoPageProps) {
  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-900">
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fff7e8] via-white to-[#f7f1e6]" />
          <div className="mx-auto max-w-4xl px-6 py-20">
            <Link href={backHref} className="text-xs font-semibold uppercase tracking-[0.45em] text-amber-500">
              ← ДомСтрой
            </Link>
            {subtitle && (
              <p className="mt-8 text-sm uppercase tracking-[0.35em] text-amber-600">{subtitle}</p>
            )}
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">{title}</h1>
            {intro && <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{intro}</p>}

            {paragraphs.length > 0 && (
              <div className="mt-8 space-y-5 text-base leading-relaxed text-slate-600">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}

            {links.length > 0 && (
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group rounded-2xl border border-amber-100 bg-white px-5 py-4 shadow-sm transition hover:border-amber-300 hover:shadow-md"
                  >
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600">{link.label}</p>
                    {link.description && (
                      <p className="mt-1 text-sm text-slate-500">{link.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/"
              className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 transition hover:text-amber-700"
            >
              Вернуться на главную
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
