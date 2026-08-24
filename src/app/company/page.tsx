import type { Metadata } from "next";
import CompanyClient from "./CompanyClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "О компании",
  description:
    "ДомСтрой — магазин строительных и отделочных материалов для ремонта, стройки и благоустройства. Работаем с частными клиентами и организациями, помогаем с доставкой, подбором материалов и сопутствующими услугами.",
  path: "/company",
});

export default function CompanyPage() {
  return <CompanyClient />;
}
