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
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
          <Link href="/" className="text-xs font-semibold uppercase tracking-[0.45em] text-amber-500">
            ← ДомСтрой
          </Link>
          <h1 className="mt-6 max-w-4xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Сертификаты, лицензии и допуски ДомСтрой
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Мы работаем с документами, которые подтверждают происхождение, безопасность и качество поставляемых материалов. Здесь
            собраны ключевые сертификаты, подтверждающие надежность ДомСтрой как поставщика строительной продукции.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 sm:mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-600 sm:text-sm sm:tracking-[0.35em]">все сертификаты</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">Документы для работы и государственных проектов</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CERTIFICATES.map((certificate) => (
              <div key={certificate.id} className="rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-sm sm:rounded-3xl sm:p-4">
                <div className="relative h-56 overflow-hidden rounded-xl bg-slate-50 sm:h-64 sm:rounded-2xl">
                  <Image src={certificate.image} alt={certificate.title} fill className="object-contain p-4 sm:p-6" />
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
