export type Lookbook = {
  slug: string;
  title: string;
  accent: string;
  image: string;
  imagePosition?: string;
  description: string;
};

export const LOOKBOOKS: Lookbook[] = [
  {
    slug: "elektroinstrumenty",
    title: "Электроинструменты и расходные материалы",
    accent: "Электроинструменты",
    image: "/banner4-light.png",
    imagePosition: "80% center",
    description:
      "Аккумуляторные дрели-шуруповёрты, перфораторы, угловые шлифовальные машины и пилы для повседневных работ на объекте. Подбираем свёрла, диски, щётки и другие расходники, а также средства малой механизации под конкретную задачу.",
  },
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
];
