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
    slug: "nabor-6v1",
    title: "Набор 6в1",
    accent: "Электроинструменты",
    image: "/card/nabor-6v1.jpg",
    description:
      "Вольтаж: 21В. В комплект входят: · Шуруповерт 21-13 · Гайковерт 1280 · Перфоратор 05-24 · УШМ 5230 · Цепная пила 8205 · Циркулярная пила 150 · 4 АКБ (4x6.0Ач) · 2 зарядных станции.",
  },
  {
    slug: "nabor-4v1",
    title: "Набор 4в1",
    accent: "Электроинструменты",
    image: "/card/nabor-4v1.jpg",
    description:
      "Вольтаж: 21В. В комплект входят: · Шуруповерт 21-13 · Гайковерт 680 · Перфоратор 05-24 · УШМ 5230 · 4 АКБ (4x6.0Ач) · 2 зарядных станции.",
  },
  {
    slug: "nabor-3v1",
    title: "Набор 3в1",
    accent: "Электроинструменты",
    image: "/card/nabor-3v1.jpg",
    description:
      "Вольтаж: 21В. В комплект входят: · УШМ 5230 · Гайковерт 1280 · Перфоратор 8030 · 2 АКБ (2x8.0Ач) · 1 зарядная станция.",
  },
  {
    slug: "nabor-2v1",
    title: "Набор 2в1",
    accent: "Электроинструменты",
    image: "/card/nabor-2v1.jpg",
    description:
      "Вольтаж: 21В. В комплект входят: · Гайковерт FBH-688 · Шуруповерт FBH-20-13A · 2 АКБ x8.0Ач (21700) · 1 зарядная станция.",
  },
];
