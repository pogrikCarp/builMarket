import InfoPage from "@/components/InfoPage";

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
