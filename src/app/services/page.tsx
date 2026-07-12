import InfoPage from "@/components/InfoPage";

export default function ServicesPage() {
  return (
    <InfoPage
      subtitle="услуги"
      title="Услуги ДомСтрой"
      intro="Помогаем не только с покупкой материалов, но и с сопутствующими работами: доставкой, погрузкой, колеровкой и кредитованием."
      links={[
        { label: "Доставка", href: "/services/dostavka", description: "Доставка материалов по Москве и области" },
        { label: "Погрузочные работы", href: "/services/pogruzochnye-raboty", description: "Погрузка и разгрузка на объекте" },
        { label: "Колеровка", href: "/services/kolerovka", description: "Подбор и колеровка красок в магазине" },
        { label: "Кредитование", href: "/services/kreditovanie", description: "Покупка в кредит или с оплатой картой" },
      ]}
    />
  );
}
