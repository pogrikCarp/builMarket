export type Lookbook = {
  slug: string;
  title: string;
  accent: string;
  image: string;
  description: string;
};

export const LOOKBOOKS: Lookbook[] = [
  {
    slug: "dobornye-elementy-dlya-saydinga",
    title: "Доборные элементы для сайдинга",
    accent: "Фасадное решение",
    image: "/card/card4.png",
    description:
      "Готовый набор доборных элементов для монтажа сайдинга: угловые профили, стартовые и финишные планки, софиты и крепёж. Подбираем комплект под площадь и конфигурацию фасада.",
  },
  {
    slug: "komplektuyushchie-dlya-vodostochnoy-sistemy",
    title: "Комплектующие для водосточной системы",
    accent: "Водосточная система",
    image: "/card/card3.png",
    description:
      "Полный набор для сборки водостока: желоба, воронки, трубы, колена и держатели. Помогаем рассчитать количество элементов по периметру крыши.",
  },
  {
    slug: "komplektuyushchie-dlya-podvesnogo-potolka",
    title: "Комплектующие для подвесного потолка",
    accent: "Потолки",
    image: "/card/card2.png",
    description:
      "Комплект для монтажа подвесного потолка: профили, подвесы, направляющие и крепёжные элементы. Подходит для жилых и коммерческих помещений.",
  },
  {
    slug: "materialy-dlya-potolka-iz-gipsokartona",
    title: "Комплектующие для потолка из гипсокартона",
    accent: "Работы с ГКЛ",
    image: "/card/card1.png",
    description:
      "Набор материалов для потолка из гипсокартона: листы ГКЛ, профиль, саморезы, серпянка и шпаклёвка. Всё необходимое для чистового монтажа.",
  },
];
