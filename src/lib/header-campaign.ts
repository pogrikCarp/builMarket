export const HEADER_THEMES = [
  { key: "sale-1111", name: "11.11 — большая распродажа", title: "11.11", eyebrow: "Большая распродажа", image: "/header-themes/sale-1111-light.webp", caption: "Время выгодных решений", buttonLabel: "Поймать скидки", accent: "#9a5a16", background: "#fffdf9", color: "#30291f", buttonColor: "#f4c77d", buttonTextColor: "#33210c" },
  { key: "new-year", name: "Новогодние акции", title: "Новогодние акции", eyebrow: "Тепло начинается с дома", image: "/header-themes/new-year-light.webp", caption: "Подарки для дома и тех, кто его строит", buttonLabel: "За подарками", accent: "#286144", background: "#fcfdfb", color: "#244535", buttonColor: "#286144", buttonTextColor: "#ffffff" },
  { key: "black-friday", name: "Чёрная пятница", title: "Чёрная пятница", eyebrow: "Время выбирать лучшее", image: "/header-themes/black-friday-light.webp", caption: "Большие планы — выгодные покупки", buttonLabel: "Забрать выгодно", accent: "#67533a", background: "#fffdf9", color: "#292622", buttonColor: "#292622", buttonTextColor: "#ffffff" },
  { key: "spring", name: "Весенние акции", title: "Сезон обновлений", eyebrow: "Весенние акции", image: "/header-themes/spring-light.webp", caption: "Новые идеи для вашего дома", buttonLabel: "Навстречу скидкам", accent: "#496731", background: "#fdfefa", color: "#354727", buttonColor: "#496731", buttonTextColor: "#ffffff" },
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
    return { name: campaign.customTitle, title: campaign.customTitle, eyebrow: "Специальные предложения", image: campaign.customImage, caption: "Выгодные предложения для ваших планов", buttonLabel: campaign.buttonLabel || "Смотреть акции", accent: "#9a5a16", background: "#fffdf9", color: "#30291f", buttonColor: "#f4c77d", buttonTextColor: "#33210c" };
  }
  const theme = HEADER_THEMES.find((item) => item.key === campaign.theme);
  return theme ? { ...theme, buttonLabel: campaign.buttonLabel || theme.buttonLabel } : null;
}
