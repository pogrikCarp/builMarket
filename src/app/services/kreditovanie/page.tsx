import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Кредитование",
  description: "Оформление покупки строительных материалов в кредит или рассрочку через банки-партнёры ДомСтрой.",
  path: "/services/kreditovanie",
});

export default function CreditPage() {
  return (
    <InfoPage
      subtitle="услуги"
      title="Кредитование"
      intro="Оформите покупку строительных материалов в кредит или рассрочку."
      paragraphs={[
        "Мы сотрудничаем с банками-партнёрами и можем предложить оформление покупки в кредит непосредственно при заказе.",
        "Условия кредитования зависят от суммы заказа и выбранного банка-партнёра.",
        "Подробности уточняйте у менеджера по телефону +7 916 004-55-22 или на условиях оплаты.",
      ]}
      links={[{ label: "Условия оплаты", href: "/help/payment", description: "Все способы оплаты заказа" }]}
    />
  );
}
