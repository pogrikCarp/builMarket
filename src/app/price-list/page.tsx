import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Прайс-лист",
  description: "Актуальный прайс-лист на строительные материалы ДомСтрой — узнайте цены и наличие по телефону, почте или в каталоге.",
  path: "/price-list",
});

export default function PriceListPage() {
  return (
    <InfoPage
      subtitle="контакты"
      title="Прайс-лист"
      intro="Актуальный прайс-лист на строительные материалы ДомСтрой."
      paragraphs={[
        "Чтобы получить полный прайс-лист в удобном формате, оставьте заявку по телефону +7 916 004-55-22 или на почту info@marketdomstroy.ru (доп. почта: domstroy.dmd@mail.ru) — менеджер отправит актуальный файл с ценами и наличием.",
        "Также цены на большинство позиций доступны прямо в каталоге товаров на сайте.",
      ]}
      links={[{ label: "Перейти в каталог", href: "/catalog", description: "Актуальные цены и наличие по товарам" }]}
    />
  );
}
