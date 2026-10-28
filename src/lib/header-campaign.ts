export const HEADER_THEMES = [
  { key: "sale-1111", name: "11.11 — большая распродажа", title: "11.11", eyebrow: "Большая распродажа", image: "/header-themes/sale-1111.webp", caption: "Время выгодных решений", buttonLabel: "Поймать скидки", accent: "#edbd78", background: "#141414", color: "#faf6ef", buttonColor: "#edbd78" },
  { key: "new-year", name: "Новогодние акции", title: "Новогодние акции", eyebrow: "Тепло начинается с дома", image: "/header-themes/new-year.webp", caption: "Подарки для дома и тех, кто его строит", buttonLabel: "За подарками", accent: "#dec694", background: "#111817", color: "#faf6ef", buttonColor: "#dec694" },
  { key: "black-friday", name: "Чёрная пятница", title: "Чёрная пятница", eyebrow: "Время выбирать лучшее", image: "/header-themes/black-friday.webp", caption: "Большие планы — выгодные покупки", buttonLabel: "Забрать выгодно", accent: "#e0b075", background: "#101113", color: "#faf6ef", buttonColor: "#e0b075" },
  { key: "spring", name: "Весенние акции", title: "Сезон обновлений", eyebrow: "Весенние акции", image: "/header-themes/spring.webp", caption: "Новые идеи для вашего дома", buttonLabel: "Навстречу скидкам", accent: "#c6ce9d", background: "#141916", color: "#faf6ef", buttonColor: "#c6ce9d" },
] as const;

export type HeaderThemeKey = "none" | "custom" | (typeof HEADER_THEMES)[number]["key"];
export type HeaderCampaign = {
  theme: HeaderThemeKey;
  customImage: string | null;
  customTitle: string;
  buttonLabel: string;
};
export type HeaderCampaignState = { campaign: HeaderCampaign; hasPromos: boolean };
export const EMPTY_HEADER_CAMPAIGN: HeaderCampaign = { theme: "none", customImage: null, customTitle: "Сезонные акции", buttonLabel: "" };

export function isHeaderTheme(value: unknown): value is HeaderThemeKey {
  return value === "none" || value === "custom" || HEADER_THEMES.some((item) => item.key === value);
}

export function resolveHeaderTheme(campaign: HeaderCampaign) {
  if (campaign.theme === "none") return null;
  if (campaign.theme === "custom") {
    if (!campaign.customImage) return null;
    return { name: campaign.customTitle, title: campaign.customTitle, eyebrow: "Специальные предложения", image: campaign.customImage, caption: "Выгодные предложения для ваших планов", buttonLabel: campaign.buttonLabel || "Смотреть акции", accent: "#edbd78", background: "#141414", color: "#faf6ef", buttonColor: "#edbd78" };
  }
  const theme = HEADER_THEMES.find((item) => item.key === campaign.theme);
  return theme ? { ...theme, buttonLabel: campaign.buttonLabel || theme.buttonLabel } : null;
}
