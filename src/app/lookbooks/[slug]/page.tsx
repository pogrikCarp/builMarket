import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import { LOOKBOOKS } from "@/lib/lookbooks";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return LOOKBOOKS.map((lookbook) => ({ slug: lookbook.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const lookbook = LOOKBOOKS.find((item) => item.slug === slug);
  if (!lookbook) return buildMetadata({ title: "Набор не найден", description: "Набор не найден", path: `/lookbooks/${slug}`, noindex: true });

  return buildMetadata({
    title: `${lookbook.title} — готовый набор электроинструментов`,
    description: lookbook.description,
    path: `/lookbooks/${lookbook.slug}`,
    image: lookbook.image,
  });
}

export default async function LookbookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lookbook = LOOKBOOKS.find((item) => item.slug === slug);

  if (!lookbook) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-900">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Главная", path: "/" },
          { name: "Наборы", path: "/lookbooks" },
          { name: lookbook.title, path: `/lookbooks/${lookbook.slug}` },
        ])}
      />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fff7e8] via-white to-[#f7f1e6]" />
          <div className="mx-auto max-w-5xl px-6 py-20">
            <Link href="/lookbooks" className="text-xs font-semibold uppercase tracking-[0.45em] text-amber-500">
              ← Все наборы
            </Link>
            <p className="mt-8 text-sm uppercase tracking-[0.35em] text-amber-600">{lookbook.accent}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">{lookbook.title}</h1>
            <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-center">
              <div className="relative overflow-hidden rounded-3xl shadow-lg" style={{ aspectRatio: "0.62" }}>
                <Image
                  src={lookbook.image}
                  alt={lookbook.title}
                  fill
                  className="object-cover"
                  style={{ objectPosition: lookbook.imagePosition ?? "center" }}
                />
              </div>
              <div>
                <p className="text-lg leading-8 text-slate-600">{lookbook.description}</p>
                <Link
                  href="/catalog"
                  prefetch={false}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-amber-600"
                >
                  Смотреть материалы в каталоге
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
