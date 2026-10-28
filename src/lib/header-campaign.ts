export const HEADER_THEMES = [
  { key: "sale-1111", name: "11.11 — большая распродажа", image: "/stickers/sale-1111.svg", caption: "Время выгодных покупок", buttonLabel: "Поймать скидки", background: "#fff7e6", color: "#92400e", buttonColor: "#b45309" },
  { key: "new-year", name: "Новогодние акции", image: "/stickers/new-year.svg", caption: "Подарки для дома и тех, кто его строит", buttonLabel: "За подарками", background: "#eef7f2", color: "#14532d", buttonColor: "#166534" },
  { key: "black-friday", name: "Чёрная пятница", image: "/stickers/black-friday.svg", caption: "Большие планы — выгодные покупки", buttonLabel: "Забрать выгодно", background: "#f3effc", color: "#4c1d95", buttonColor: "#6d28d9" },
  { key: "spring", name: "Весенние акции", image: "/stickers/spring.svg", caption: "Обновляем дом, встречаем весну", buttonLabel: "Навстречу скидкам", background: "#f3f8e9", color: "#365314", buttonColor: "#3f6212" },
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
    return { name: campaign.customTitle, image: campaign.customImage, caption: "Выгодные предложения для ваших планов", buttonLabel: campaign.buttonLabel || "Смотреть акции", background: "#fff7e6", color: "#92400e", buttonColor: "#b45309" };
  }
  const theme = HEADER_THEMES.find((item) => item.key === campaign.theme);
  return theme ? { ...theme, buttonLabel: campaign.buttonLabel || theme.buttonLabel } : null;
}
