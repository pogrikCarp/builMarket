import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Акция дня",
  description: "Товары со специальной ценой в магазине ДомСтрой — актуальные акции на строительные материалы.",
  path: "/promo",
});

export default function PromoPage() {
  return (
    <InfoPage
      subtitle="акции"
      title="Акция дня"
      intro="Каждый день мы выбираем товары со специальной ценой — успейте купить по акции."
      paragraphs={[
        "Актуальные товары дня и скидки смотрите в блоке «Лучшие предложения по акции» на главной странице.",
        "Хотите узнавать об акциях первыми — подпишитесь на нашу рассылку или уточните у менеджера по телефону +7 916 004-55-22.",
      ]}
      links={[{ label: "Смотреть акции", href: "/catalog?section=promo", description: "Все товары по специальным ценам" }]}
    />
  );
}
