import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Гарантия",
  description: "Гарантийные условия на товары ДомСтрой и порядок возврата или обмена.",
  path: "/help/warranty",
});

export default function WarrantyPage() {
  return (
    <InfoPage
      subtitle="информация"
      title="Гарантия"
      intro="Мы работаем только с проверенными производителями и предоставляем гарантию на товары."
      paragraphs={[
        "Гарантийный срок зависит от конкретного товара и указывается производителем — уточняйте у менеджера при покупке.",
        "При обнаружении производственного дефекта товар можно вернуть или обменять в соответствии с законом «О защите прав потребителей».",
        "Для оформления гарантийного случая свяжитесь с нами по телефону +7 916 004-55-22.",
      ]}
    />
  );
}
