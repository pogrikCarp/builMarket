import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Вакансии",
  description: "Вакансии и работа в ДомСтрой — отправьте резюме, если хотите присоединиться к команде.",
  path: "/vacancies",
});

export default function VacanciesPage() {
  return (
    <InfoPage
      subtitle="документы"
      title="Карьера"
      intro="ДомСтрой растёт, и мы всегда рады сильной команде."
      paragraphs={[
        "Сейчас открытых вакансий на сайте нет, но вы можете отправить резюме на info@marketdomstroy.ru (доп. почта: domstroy.dmd@mail.ru) — мы свяжемся с вами, если появится подходящая позиция.",
        "Расскажите о своём опыте и в какой роли вы видите себя в ДомСтрой.",
      ]}
    />
  );
}
