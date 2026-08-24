import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Колеровка красок",
  description: "Подбор и колеровка краски нужного оттенка прямо в магазине ДомСтрой.",
  path: "/services/kolerovka",
});

export default function ColoringPage() {
  return (
    <InfoPage
      subtitle="услуги"
      title="Колеровка"
      intro="Подберём и колеруем краску нужного оттенка прямо в магазине."
      paragraphs={[
        "Колеровочный аппарат позволяет получить точный оттенок по каталогу цветов или по образцу.",
        "Услуга доступна для большинства красок и эмалей из нашего каталога.",
        "Чтобы уточнить наличие оттенка и стоимость колеровки, свяжитесь с нами по телефону +7 916 004-55-22.",
      ]}
    />
  );
}
