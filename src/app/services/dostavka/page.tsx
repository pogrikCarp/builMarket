import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Доставка",
  description: "Доставка строительных и отделочных материалов ДомСтрой по Москве и Московской области.",
  path: "/services/dostavka",
});

export default function DeliveryPage() {
  return (
    <InfoPage
      subtitle="услуги"
      title="Доставка"
      intro="Доставляем строительные и отделочные материалы по Москве и Московской области."
      paragraphs={[
        "Стоимость и сроки доставки зависят от объёма и веса заказа, а также адреса. Менеджер рассчитает точную стоимость при оформлении заказа.",
        "Доступна доставка малогабаритных и крупногабаритных грузов, включая сыпучие и штучные материалы.",
        "Для расчёта доставки позвоните по телефону +7 916 004-55-22 или оставьте заявку на сайте.",
      ]}
      links={[{ label: "Погрузочные работы", href: "/services/pogruzochnye-raboty", description: "Погрузка и разгрузка на объекте" }]}
    />
  );
}
