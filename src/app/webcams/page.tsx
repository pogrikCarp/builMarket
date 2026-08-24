import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";

// Раздел пока в разработке (см. текст ниже) - индексировать заглушку с тонким
// контентом не имеет смысла, чтобы не создавать проблем с качеством выдачи.
export const metadata: Metadata = buildMetadata({
  title: "Онлайн-трансляция",
  description: "Онлайн-трансляция со склада и торговой площадки ДомСтрой.",
  path: "/webcams",
  noindex: true,
});

export default function WebcamsPage() {
  return (
    <InfoPage
      subtitle="контакты"
      title="Онлайн-трансляция"
      intro="Онлайн-трансляция со склада и торговой площадки ДомСтрой."
      paragraphs={[
        "Мы готовим подключение веб-камер, чтобы вы могли увидеть склад и отгрузку материалов в реальном времени.",
        "Раздел временно находится в разработке. Если вам нужно уточнить наличие товара прямо сейчас — позвоните по телефону +7 916 004-55-22.",
      ]}
    />
  );
}
