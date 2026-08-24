import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Условия оплаты",
  description: "Способы оплаты заказа в ДомСтрой: наличными, безналичным расчётом или в кредит.",
  path: "/help/payment",
});

export default function PaymentPage() {
  return (
    <InfoPage
      subtitle="информация"
      title="Условия оплаты"
      intro="Мы предлагаем несколько удобных способов оплаты заказа."
      paragraphs={[
        "Наличными — при получении заказа на складе или курьеру при доставке.",
        "Безналичным расчётом — банковской картой онлайн или по счёту для организаций.",
        "В кредит — оформление покупки в кредит через банки-партнёры.",
      ]}
      links={[{ label: "Кредитование", href: "/services/kreditovanie", description: "Подробнее об оформлении кредита" }]}
    />
  );
}
