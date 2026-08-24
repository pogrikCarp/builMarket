import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Лицензии",
  description: "Лицензии, сертификаты соответствия и декларации на продукцию ДомСтрой.",
  path: "/licenses",
});

export default function LicensesPage() {
  return (
    <InfoPage
      subtitle="документы"
      title="Лицензии"
      intro="ДомСтрой работает в соответствии с действующим законодательством и подтверждающими документами."
      paragraphs={[
        "Копии лицензий, сертификатов соответствия и деклараций на продукцию предоставляются по запросу.",
        "Ознакомиться с сертификатами на отдельные товарные группы можно в разделе «Сертификаты».",
      ]}
      links={[{ label: "Все сертификаты", href: "/certificates", description: "Сертификаты и допуски на продукцию" }]}
    />
  );
}
