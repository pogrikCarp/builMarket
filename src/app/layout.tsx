import type { Metadata } from "next";
import { Inter } from "next/font/google";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "buildMarket — витрина стройматериалов",
  description: "Стартовая страница с блоками zv.market: каталог, наборы, бренды и футер",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} font-[family-name:var(--font-inter)] h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
