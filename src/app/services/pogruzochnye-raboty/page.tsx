import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Погрузочные работы",
  description: "Погрузка и разгрузка строительных материалов на складе и на объекте от ДомСтрой.",
  path: "/services/pogruzochnye-raboty",
});

export default function LoadingServicesPage() {
  return (
    <InfoPage
      subtitle="услуги"
      title="Погрузочные работы"
      intro="Организуем погрузку и разгрузку материалов на складе и на объекте."
      paragraphs={[
        "Наши сотрудники помогут аккуратно и быстро загрузить транспорт при отгрузке со склада.",
        "Также доступна услуга разгрузки на объекте при заказе доставки.",
        "Уточнить стоимость и время погрузочных работ можно у менеджера по телефону +7 916 004-55-22.",
      ]}
      links={[{ label: "Доставка", href: "/services/dostavka", description: "Доставка материалов по Москве и области" }]}
    />
  );
}
