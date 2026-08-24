import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { CartProvider } from "@/components/cart/CartProvider";
import { FavoriteProvider } from "@/components/favorites/FavoriteProvider";
import JsonLd from "@/components/JsonLd";
import { SITE_NAME, SITE_URL, buildLocalBusinessJsonLd, buildWebsiteJsonLd } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s — ${SITE_NAME}`,
    default: `${SITE_NAME} — стройматериалы, электроинструменты и наборы для ремонта`,
  },
  description:
    "ДомСтрой — магазин строительных и отделочных материалов, электроинструментов и наборов для ремонта, стройки и благоустройства. Доставка по Москве и Московской области.",
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
      lang="ru"
      className={`${inter.variable} font-[family-name:var(--font-inter)] h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={buildLocalBusinessJsonLd()} />
        <JsonLd data={buildWebsiteJsonLd()} />
        <CartProvider>
          <FavoriteProvider>{children}</FavoriteProvider>
        </CartProvider>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
