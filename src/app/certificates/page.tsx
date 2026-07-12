import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

const CERTIFICATES = [
  { id: 1, title: "Сертификат соответствия", image: "/sertificat/sert1.png" },
  { id: 2, title: "Лицензия на поставку", image: "/sertificat/sert2.png" },
  { id: 3, title: "Партнерский статус", image: "/sertificat/sert3.png" },
  { id: 4, title: "Сертификат качества", image: "/sertificat/sert4.png" },
  { id: 5, title: "Экологическая безопасность", image: "/sertificat/sert5.png" },
  { id: 6, title: "Технический допуск", image: "/sertificat/sert6.png" },
];

export default function CertificatesPage() {
  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-900">
      <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#fff7e8] via-white to-[#f7f1e6]" />
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Link href="/" className="text-xs font-semibold uppercase tracking-[0.45em] text-amber-500">
            ← ДомСтрой
          </Link>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            Сертификаты, лицензии и допуски ДомСтрой
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Мы работаем с документами, которые подтверждают происхождение, безопасность и качество поставляемых материалов. Здесь
            собраны ключевые сертификаты, подтверждающие надежность ДомСтрой как поставщика строительной продукции.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-600">все сертификаты</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Документы для работы и государственных проектов</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CERTIFICATES.map((certificate) => (
              <div key={certificate.id} className="rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm">
                <div className="relative h-64 overflow-hidden rounded-2xl bg-slate-50">
                  <Image src={certificate.image} alt={certificate.title} fill className="object-contain p-6" />
                </div>
                <p className="mt-4 text-center text-sm font-semibold text-slate-800">{certificate.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      </main>

      <SiteFooter />
    </div>
  );
}
