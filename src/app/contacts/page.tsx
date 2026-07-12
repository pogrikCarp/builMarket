import InfoPage from "@/components/InfoPage";

export default function ContactsPage() {
  return (
    <InfoPage
      subtitle="контакты"
      title="Контакты ДомСтрой"
      intro="Свяжитесь с нами удобным способом — по телефону, почте или приезжайте в магазин лично."
      paragraphs={[
        "Телефоны: 8 800 250 76 26 (звонок бесплатный), 8 499 702 55 45.",
        "Электронная почта: info@domstroy.market.",
        "Мы работаем ежедневно и готовы помочь с подбором материалов, расчётом доставки и оформлением заказа.",
      ]}
    />
  );
}
