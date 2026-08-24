import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Регистрация",
  description: "Регистрация личного кабинета покупателя ДомСтрой.",
  path: "/register",
  noindex: true,
});

export default function RegisterPage() {
  return <RegisterClient />;
}
