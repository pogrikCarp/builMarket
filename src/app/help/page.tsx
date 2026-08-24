import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Как купить",
  description: "Как оформить заказ в ДомСтрой: выбор товаров, оплата и доставка или самовывоз со склада.",
  path: "/help",
});

export default function HelpPage() {
  return (
    <InfoPage
      subtitle="информация"
      title="Как купить"
      intro="Оформить заказ в ДомСтрой можно в несколько простых шагов."
      paragraphs={[
        "1. Выберите нужные товары в каталоге и добавьте их в корзину.",
        "2. Оформите заказ на сайте или по телефону +7 916 004-55-22 — менеджер уточнит детали и наличие.",
        "3. Выберите способ оплаты и доставки, удобный для вас.",
        "4. Получите заказ самовывозом со склада или курьерской доставкой.",
      ]}
      links={[
        { label: "Условия оплаты", href: "/help/payment", description: "Наличный и безналичный расчёт, кредит" },
        { label: "Гарантия", href: "/help/warranty", description: "Гарантийные условия на товары" },
        { label: "Вопрос-ответ", href: "/faq", description: "Частые вопросы наших покупателей" },
      ]}
    />
  );
}
