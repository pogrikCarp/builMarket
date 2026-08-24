import type { Metadata } from "next";
import LoginClient from "./LoginClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Вход в личный кабинет",
  description: "Вход в личный кабинет покупателя ДомСтрой.",
  path: "/login",
  noindex: true,
});

export default function LoginPage() {
  return <LoginClient />;
}
