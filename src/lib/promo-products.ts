export type PromoProduct = {
  id: string;
  title: string;
  price: string;
  oldPrice: string;
  stock: number;
  discount: number;
  image: string;
};

export const PROMO_PRODUCTS: PromoProduct[] = [
  {
    id: "prod1",
    title: "Труба двустенная гофрированная 340/300 мм",
    price: "5 100 ₽/шт.",
    oldPrice: "6 000 ₽/шт.",
    stock: 85,
    discount: 15,
    image: "https://picsum.photos/seed/prod1/600/400",
  },
  {
    id: "prod2",
    title: "Профнастил тёмно-серый RAL 7024",
    price: "610 ₽/м²",
    oldPrice: "670 ₽/м.л.",
    stock: 441,
    discount: 9,
    image: "https://picsum.photos/seed/prod2/600/400",
  },
  {
    id: "prod3",
    title: "Knauf Rotband 30 кг",
    price: "430 ₽/меш.",
    oldPrice: "547 ₽/меш.",
    stock: 359,
    discount: 21,
    image: "https://picsum.photos/seed/prod3/600/400",
  },
  {
    id: "prod4",
    title: "Профиль потолочный 60×27",
    price: "315 ₽/шт.",
    oldPrice: "360 ₽/шт.",
    stock: 112,
    discount: 12,
    image: "https://picsum.photos/seed/prod4/600/400",
  },
  {
    id: "prod5",
    title: "Грунтовка глубокого проникновения",
    price: "280 ₽/канистра",
    oldPrice: "320 ₽/канистра",
    stock: 204,
    discount: 13,
    image: "https://picsum.photos/seed/prod5/600/400",
  },
];
