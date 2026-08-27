export type PromoProduct = {
  id: string;
  title: string;
  price: string;
  oldPrice: string;
  stock: number;
  discount: number;
  image: string;
};

// Фото товаров пока не загружены в МойСклад - используем локальную заглушку вместо
// внешнего сервиса (picsum.photos), чтобы не зависеть от стороннего хостинга изображений
// (у него нередко 403 для запросов с серверов хостинг-провайдеров) и не плодить лишние
// внешние запросы на каждый визит.
const PLACEHOLDER_IMAGE = "/promo/placeholder.svg";

export const PROMO_PRODUCTS: PromoProduct[] = [
  {
    id: "prod1",
    title: "Труба двустенная гофрированная 340/300 мм",
    price: "5 100 ₽/шт.",
    oldPrice: "6 000 ₽/шт.",
    stock: 85,
    discount: 15,
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: "prod2",
    title: "Профнастил тёмно-серый RAL 7024",
    price: "610 ₽/м²",
    oldPrice: "670 ₽/м.л.",
    stock: 441,
    discount: 9,
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: "prod3",
    title: "Knauf Rotband 30 кг",
    price: "430 ₽/меш.",
    oldPrice: "547 ₽/меш.",
    stock: 359,
    discount: 21,
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: "prod4",
    title: "Профиль потолочный 60×27",
    price: "315 ₽/шт.",
    oldPrice: "360 ₽/шт.",
    stock: 112,
    discount: 12,
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: "prod5",
    title: "Грунтовка глубокого проникновения",
    price: "280 ₽/канистра",
    oldPrice: "320 ₽/канистра",
    stock: 204,
    discount: 13,
    image: PLACEHOLDER_IMAGE,
  },
];
