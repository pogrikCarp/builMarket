"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type LinkItem = { label: string; href: string };

const CONTACTS = {
  phones: [
    { label: "8 499 702 55 45", href: "tel:84997025545" },
    { label: "8 800 250 76 26", href: "tel:88002507626", note: "Звонок бесплатный" },
  ],
  email: { label: "info@zv.market", href: "mailto:info@zv.market" },
};

const SOCIAL_LINKS: LinkItem[] = [
  { label: "ВКонтакте", href: "https://vk.com/zv.market" },
  { label: "Telegram", href: "https://t.me/zvmarketdmd" },
];

const FOOTER_COLUMNS: { title: string; items: LinkItem[] }[] = [
  {
    title: "Контакты",
    items: [
      { label: "Контакты", href: "https://zv.market/contacts/" },
      { label: "Прайс-лист", href: "https://zv.market/price.xlsx" },
      { label: "Онлайн-трансляция", href: "https://zv.market/webcams/" },
    ],
  },
  {
    title: "Услуги",
    items: [
      { label: "Доставка", href: "https://zv.market/services/dostavka/" },
      { label: "Погрузочные работы", href: "https://zv.market/services/pogruzochnye-raboty/" },
      { label: "Колеровка", href: "https://zv.market/services/kolerovka/" },
      { label: "Кредитование", href: "https://zv.market/services/kreditovanie/" },
    ],
  },
  {
    title: "Информация",
    items: [
      { label: "Как купить", href: "https://zv.market/help/" },
      { label: "Вопрос-ответ", href: "https://zv.market/info/faq/" },
      { label: "Условия оплаты", href: "https://zv.market/help/payment/" },
      { label: "Гарантия", href: "https://zv.market/help/warranty/" },
    ],
  },
  {
    title: "Документы",
    items: [
      { label: "Реквизиты", href: "https://zv.market/info/requisites/" },
      { label: "Политика конфиденциальности", href: "/privacy" },
      { label: "Политика обработки персональных данных", href: "/personal-data" },
      { label: "Лицензии", href: "https://zv.market/company/licenses/" },
      { label: "Карьера", href: "https://zv.market/company/vakansii/" },
    ],
  },
];

const QUICK_LINKS: LinkItem[] = [
  { label: "Акция дня", href: "https://zv.market/product-day/" },
];

const HEADER_ACTIONS = [
  { label: "Войти", sub: "личный кабинет" },
  { label: "Избранное", sub: "0 товаров" },
  { label: "Корзина", sub: "0 ₽" },
];

type CategoryGroup = { title: string; items: LinkItem[] };
type CategoryCard = { title: string; caption: string; groups: CategoryGroup[] };

const CATEGORIES: CategoryCard[] = [
  {
    title: "Строительные материалы",
    caption: "Сетки, арматура, кровля, ЖБИ",
    groups: [
      {
        title: "Каркас и металлопрокат",
        items: [
          { label: "Сетки металлические", href: "https://zv.market/catalog/stroitelnye-materialy/setki/metallicheskie/" },
          { label: "Арматура композитная", href: "https://zv.market/catalog/metalloprokat/armatura/kompozitnaya/" },
          { label: "Швеллер", href: "https://zv.market/catalog/metalloprokat/shveller/" },
          { label: "Профильная труба", href: "https://zv.market/catalog/metalloprokat/profilnaya-truba/" },
        ],
      },
      {
        title: "Кровля и фасады",
        items: [
          { label: "Металлическая кровля", href: "https://zv.market/catalog/stroitelnye-materialy/krovelnye-materialy/metallicheskaya-krovlya/" },
          { label: "Ондулин", href: "https://zv.market/catalog/stroitelnye-materialy/krovelnye-materialy/ondulin/" },
          { label: "Поликарбонат", href: "https://zv.market/catalog/stroitelnye-materialy/krovelnye-materialy/polikarbonat/" },
          { label: "Вентиляция кровли", href: "https://zv.market/catalog/stroitelnye-materialy/krovelnye-materialy/ventilyatsiya-dlya-krovli/" },
        ],
      },
      {
        title: "Основания и ЖБИ",
        items: [
          { label: "Сухие смеси", href: "https://zv.market/catalog/stroitelnye-materialy/sukhie-stroitelnye-smesi/" },
          { label: "Тротуарная плитка", href: "https://zv.market/catalog/stroitelnye-materialy/trotuarnye-elementy/trotuarnaya-plitka/" },
          { label: "Бетонные кольца", href: "https://zv.market/catalog/stroitelnye-materialy/zhbi/betonnye-koltsa/" },
          { label: "Плоский шифер", href: "https://zv.market/catalog/stroitelnye-materialy/asbestotekhnicheskie-izdeliya/" },
        ],
      },
    ],
  },
  {
    title: "Сантехника и инженерка",
    caption: "Инженерные системы, насосы, водоочистка",
    groups: [
      {
        title: "Инженерная сантехника",
        items: [
          { label: "Люк сантехнический", href: "https://zv.market/catalog/santekhnika/inzhenernaya-santekhnika/lyuk-santekhnicheskiy/" },
          { label: "Герметизация соединений", href: "https://zv.market/catalog/santekhnika/inzhenernaya-santekhnika/germetizatsiya-rezbovykh-i-plastikovykh-soedineniy/" },
          { label: "Комплектующие к унитазу", href: "https://zv.market/catalog/santekhnika/inzhenernaya-santekhnika/komplektuyushchie-k-unitazu/" },
          { label: "Комплектующие к ванне", href: "https://zv.market/catalog/santekhnika/inzhenernaya-santekhnika/komplektuyushchie-k-vanne/" },
        ],
      },
      {
        title: "Насосное оборудование",
        items: [
          { label: "Скважинные насосы", href: "https://zv.market/catalog/santekhnika/nasosnoe-oborudovanie/skvazhinnye-nasosy/" },
          { label: "Дренажные насосы", href: "https://zv.market/catalog/santekhnika/nasosnoe-oborudovanie/drenazhnye-nasosy/" },
          { label: "Циркуляционные насосы", href: "https://zv.market/catalog/santekhnika/nasosnoe-oborudovanie/tsirkulyatsionnye-nasosy/" },
          { label: "Насосные станции", href: "https://zv.market/catalog/santekhnika/nasosnoe-oborudovanie/nasosnye-stantsii/" },
        ],
      },
      {
        title: "Тепло и вода",
        items: [
          { label: "Полипропиленовые трубы", href: "https://zv.market/catalog/santekhnika/truby-i-fitingi/polipropilen-pp/" },
          { label: "Трубы ПНД", href: "https://zv.market/catalog/santekhnika/truby-i-fitingi/polietilen-nizkogo-davleniya-pnd/" },
          { label: "Счетчики воды", href: "https://zv.market/catalog/santekhnika/kip/schyotchiki-dlya-vody/" },
          { label: "Фильтры для воды", href: "https://zv.market/catalog/santekhnika/vodoochistka/filtry-dlya-vody/" },
        ],
      },
    ],
  },
  {
    title: "Электрика и инструменты",
    caption: "Кабель, свет, измерительный инструмент",
    groups: [
      {
        title: "Электромонтаж",
        items: [
          { label: "Кабель ВВГнг", href: "https://zv.market/catalog/elektrika/kabelnaya-produktsiya/kabel-vvgng/" },
          { label: "Автоматические выключатели", href: "https://zv.market/catalog/elektrika/modulnoe-oborudovanie/avtomaticheskie-vyklyuchateli/" },
          { label: "Электроустановочные изделия", href: "https://zv.market/catalog/elektrika/elektroustanovochnye-izdeliya/" },
          { label: "Комплекты заземления", href: "https://zv.market/catalog/elektrika/komplekty-zazemleniya/" },
        ],
      },
      {
        title: "Инструменты",
        items: [
          { label: "Лазерные уровни", href: "https://zv.market/catalog/instrumenty/izmeritelnyy-i-razmetochniy-instrument/lazernye-urovni/" },
          { label: "Рулетки", href: "https://zv.market/catalog/instrumenty/izmeritelnyy-i-razmetochniy-instrument/ruletki/" },
          { label: "Строительные пылесосы", href: "https://zv.market/catalog/instrumenty/stroitelnye-pylesosy/" },
          { label: "Технические светильники", href: "https://zv.market/catalog/stroitelnye-materialy/stroitelnoe-oborudovanie/tekhnicheskie-svetilniki/" },
        ],
      },
      {
        title: "Свет и питание",
        items: [
          { label: "Светильники", href: "https://zv.market/catalog/elektrika/svetotekhnika/svetilniki/" },
          { label: "Источники питания", href: "https://zv.market/catalog/elektrika/svetotekhnika/istochniki-pitaniya/" },
          { label: "Прожекторы", href: "https://zv.market/catalog/elektrika/svetotekhnika/prozhektory/" },
          { label: "Датчики движения", href: "https://zv.market/catalog/elektrika/svetotekhnika/datchiki-dvizheniya/" },
        ],
      },
    ],
  },
];

type CatalogGroup = {
  id: string;
  title: string;
  description?: string;
  moyskladFolderId?: string;
  subgroups: {
    title: string;
    items: string[];
    moyskladFolderId?: string;
  }[];
};

const CATALOG_GROUPS: CatalogGroup[] = [
  {
    id: "construction",
    title: "Строительные материалы",
    description: "Сухие смеси, растворы, бетон",
    moyskladFolderId: "moysklad-root-construction",
    subgroups: [
      {
        title: "Сухие строительные смеси",
        moyskladFolderId: "drymix",
        items: [
          "Штукатурки",
          "Шпаклёвки",
          "Кладочные смеси",
          "Самонивелирующиеся полы",
          "Клеи для плитки",
        ],
      },
      {
        title: "ЖБИ и бетон",
        items: [
          "Бетонные кольца",
          "Лотки",
          "Перемычки",
          "Плиты перекрытия",
          "Фундаменты",
        ],
      },
      {
        title: "Сопутствующие материалы",
        items: [
          "Грунтовки",
          "Гидроизоляция",
          "Добавки",
          "Армирующие сетки",
        ],
      },
    ],
  },
  {
    id: "engineering",
    title: "Инженерные системы",
    description: "Отопление, сантехника, вентиляция",
    subgroups: [
      {
        title: "Сантехника",
        items: [
          "Трубы и фитинги",
          "Смесители",
          "Инженерная сантехника",
          "Системы фильтрации",
        ],
      },
      {
        title: "Отопление",
        items: [
          "Котлы",
          "Радиаторы",
          "Тёплый пол",
          "Коллекторы",
        ],
      },
      {
        title: "Вентиляция",
        items: [
          "Воздуховоды",
          "Вентиляторы",
          "Рекуператоры",
        ],
      },
    ],
  },
  {
    id: "finishing",
    title: "Отделочные материалы",
    description: "Фасады, интерьер, краски",
    subgroups: [
      {
        title: "Фасадные решения",
        items: [
          "Сайдинг",
          "Фасадные панели",
          "Термопанели",
        ],
      },
      {
        title: "Интерьер",
        items: [
          "Гипсокартон",
          "Потолочные системы",
          "Декоративная штукатурка",
          "Напольные покрытия",
        ],
      },
      {
        title: "Лакокрасочные материалы",
        items: [
          "Краски interior",
          "Краски exterior",
          "Эмали",
          "Пропитки",
        ],
      },
    ],
  },
  {
    id: "logistics",
    title: "Инструмент и логистика",
    description: "Инструмент, техника, СИЗ",
    subgroups: [
      {
        title: "Инструмент",
        items: [
          "Электроинструмент",
          "Ручной инструмент",
          "Расходные материалы",
        ],
      },
      {
        title: "Спецодежда и СИЗ",
        items: [
          "Перчатки",
          "Каски",
          "Защитные очки",
        ],
      },
      {
        title: "Логистика",
        items: [
          "Погрузочная техника",
          "Грузовые услуги",
          "Аренда складов",
        ],
      },
    ],
  },
];

const SETS = [
  {
    title: "Доборные элементы для сайдинга",
    href: "https://zv.market/lookbooks/dobornye-elementy-dlya-saydinga/",
    accent: "Фасадное решение",
    image: "/card/card4.png",
  },
  {
    title: "Комплектующие для водосточной системы",
    href: "https://zv.market/lookbooks/komplektuyushchie-dlya-vodostochnoy-sistemy/",
    accent: "Водосточная система",
    image: "/card/card3.png",
  },
  {
    title: "Комплектующие для подвесного потолка",
    href: "https://zv.market/lookbooks/komplektuyushchie-dlya-podvesnogo-potolka/",
    accent: "Потолки",
    image: "/card/card2.png",
  },
  {
    title: "Комплектующие для потолка из гипсокартона",
    href: "https://zv.market/lookbooks/materialy-dlya-potolka-iz-gipsokartona/",
    accent: "Работы с ГКЛ",
    image: "/card/card1.png",
  },
];

const BRAND_LINKS: LinkItem[] = [
  { label: "Все бренды", href: "/brands" },
  { label: "Все сертификаты", href: "/certificates" },
];

const BRANDS: { name: string; logo: string }[] = [
  { name: "Бренд 1", logo: "/comp/comp1.jpg" },
  { name: "Бренд 2", logo: "/comp/comp2.jpg" },
  { name: "Бренд 3", logo: "/comp/comp3.png" },
  { name: "Бренд 4", logo: "/comp/comp4.jpg" },
  { name: "Бренд 5", logo: "/comp/comp5.png" },
  { name: "Бренд 6", logo: "/comp/comp6.jpg" },
  { name: "Бренд 7", logo: "/comp/comp7.jpg" },
  { name: "Бренд 8", logo: "/comp/comp8.jpg" },
  { name: "Бренд 9", logo: "/comp/comp9.webp" },
  { name: "Бренд 10", logo: "/comp/comp10.jpg" },
];

const CERT_PLACEHOLDERS = [
  { id: 1, label: "Сертификат №1", image: "/sertificat/sert1.png" },
  { id: 2, label: "Сертификат №2", image: "/sertificat/sert2.png" },
  { id: 3, label: "Сертификат №3", image: "/sertificat/sert3.png" },
  { id: 4, label: "Сертификат №4", image: "/sertificat/sert4.png" },
  { id: 5, label: "Сертификат №5", image: "/sertificat/sert5.png" },
  { id: 6, label: "Сертификат №6", image: "/sertificat/sert6.png" },
];

const HERO_SLIDES = [
  {
    id: 1,
    brand: "ОСНОВИТ",
    caption: "Строй основательно",
    image: "/car13.png",
    highlights: ["Сухие смеси", "Грунтовки", "Монтажные растворы"],
  },
  {
    id: 2,
    brand: "ТЕХНОНИКОЛЬ",
    caption: "Доставка комплектов под ключ",
    image: "/car2.png",
    highlights: ["Доставим за 24 часа", "Самовывоз со склада", "Онлайн отслеживание"],
  },
  {
    id: 3,
    brand: "KNAUF",
    caption: "Инженерные решения для сантехники",
    image: "/car3.png",
    highlights: ["Водоснабжение", "Отопление", "Монтаж инженерии"],
  },
];

const PROMO_PRODUCTS = [
  {
    title: "Труба двустенная гофрированная 340/300 мм",
    price: "5 100 ₽/шт.",
    oldPrice: "6 000 ₽/шт.",
    stock: 85,
    discount: 15,
    image: "https://picsum.photos/seed/prod1/600/400",
  },
  {
    title: "Профнастил тёмно-серый RAL 7024",
    price: "610 ₽/м²",
    oldPrice: "670 ₽/м.л.",
    stock: 441,
    discount: 9,
    image: "https://picsum.photos/seed/prod2/600/400",
  },
  {
    title: "Knauf Rotband 30 кг",
    price: "430 ₽/меш.",
    oldPrice: "547 ₽/меш.",
    stock: 359,
    discount: 21,
    image: "https://picsum.photos/seed/prod3/600/400",
  },
  {
    title: "Профиль потолочный 60×27",
    price: "315 ₽/шт.",
    oldPrice: "360 ₽/шт.",
    stock: 112,
    discount: 12,
    image: "https://picsum.photos/seed/prod4/600/400",
  },
  {
    title: "Грунтовка глубокого проникновения",
    price: "280 ₽/канистра",
    oldPrice: "320 ₽/канистра",
    stock: 204,
    discount: 13,
    image: "https://picsum.photos/seed/prod5/600/400",
  },
];

const CallbackModal = ({ onClose }: { onClose: () => void }) => {
  const [agreed, setAgreed] = useState(false);
  const captchaChars = "WCSF";
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Закрыть"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold text-slate-900">Заказать звонок</h2>
        <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <div>
            <label className="block text-sm text-slate-700">
              Ваше имя <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700">
              Телефон <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="+7 (___) ___-__-__"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700">
              Введите текст с картинки <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="text"
                required
                className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <div className="flex items-center gap-2">
                <div className="select-none rounded border border-slate-300 bg-slate-50 px-4 py-2 font-mono text-xl font-bold tracking-[0.3em] text-slate-800 [text-decoration:line-through_wavy_rgba(0,0,0,0.2)]">
                  {captchaChars}
                </div>
                <button type="button" className="text-slate-400 hover:text-slate-700" title="Обновить">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m0 0A7.001 7.001 0 0 1 18.418 9M4.582 9H9m11 11v-5h-.581m0 0A7.001 7.001 0 0 1 5.582 15M20.419 15H16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
            <button
              type="button"
              onClick={() => setAgreed((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
                agreed ? "bg-amber-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  agreed ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            Я согласен на{" "}
            <span className="text-amber-600 underline">обработку персональных данных</span>
          </label>
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={!agreed}
              className="rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Отправить
            </button>
            <span className="text-xs text-slate-400">* – обязательные поля</span>
          </div>
        </form>
      </div>
    </div>
  );
};

const CatalogMegaMenu = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(CATALOG_GROUPS[0]?.id ?? null);

  useEffect(() => {
    if (open && CATALOG_GROUPS.length) {
      setActiveGroupId(CATALOG_GROUPS[0].id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const activeGroup = CATALOG_GROUPS.find((group) => group.id === activeGroupId) ?? CATALOG_GROUPS[0];

  return (
    <div className="fixed inset-0 z-[120] bg-white/98 px-4 py-6 text-slate-800" onClick={onClose}>
      <div className="mx-auto flex h-full max-w-7xl flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-amber-500">Каталог ДомСтрой</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-900">Быстрый доступ к группам и разделам</h3>
            <p className="text-sm text-slate-500">Списки синхронизируем с MoySklad — сейчас демо-структура для верстки</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Закрыть каталог"
          >
            ✕
          </button>
        </div>
        <div className="mt-8 flex flex-1 overflow-hidden">
          <nav className="hidden w-64 shrink-0 flex-col gap-1 border-r border-slate-200 pr-6 md:flex">
            {CATALOG_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroupId(group.id)}
                className={`flex w-full items-center justify-between border-b border-transparent py-3 text-left text-base transition ${
                  activeGroup?.id === group.id
                    ? "font-semibold text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>{group.title}</span>
                <svg className="h-3 w-3 text-slate-300" viewBox="0 0 12 12" fill="none">
                  <path d="M4 2l3 3-3 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
                </svg>
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto pl-0 md:pl-10">
            <div className="border-b border-slate-200 pb-6 md:hidden">
              <div className="flex gap-2 overflow-x-auto">
                {CATALOG_GROUPS.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroupId(group.id)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      activeGroup?.id === group.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {group.title}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
              {activeGroup?.subgroups.map((subgroup) => (
                <div key={`${activeGroup.id}-${subgroup.title}`} className="min-w-[220px] text-sm" role="listitem">
                  <h4 className="text-base font-semibold text-slate-900">{subgroup.title}</h4>
                  <ul className="mt-3 space-y-2 text-slate-600">
                    {subgroup.items.map((item) => (
                      <li key={item} className="transition hover:text-amber-600">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ title, subtitle, className = "" }: { title: string; subtitle?: string; className?: string }) => (
  <div className={`mb-8 ${className}`}>
    <p className="text-sm uppercase tracking-[0.3em] text-amber-600">{subtitle ?? ""}</p>
    <h2 className="text-2xl font-semibold text-slate-900 lg:text-3xl">{title}</h2>
  </div>
);

const CONTENT_CONTAINER = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

const HeroCarousel = ({ onOpenCatalog }: { onOpenCatalog: () => void }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = HERO_SLIDES[activeIndex];

  const goPrev = () => setActiveIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  const goNext = () => setActiveIndex((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const arrowButtonBase =
    "absolute top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm border border-white/40 bg-black/40 text-white text-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100";

  return (
    <section className="relative w-full overflow-hidden">
      <div className="group relative h-[480px] w-full min-h-[480px] overflow-hidden bg-slate-900 md:h-[560px] lg:h-[620px]">
        <Image
          src={activeSlide.image}
          alt={activeSlide.brand}
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />


        <button type="button" onClick={goPrev} className={`${arrowButtonBase} -left-12 group-hover:left-4 md:group-hover:left-6`} aria-label="Предыдущий слайд">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button type="button" onClick={goNext} className={`${arrowButtonBase} -right-12 group-hover:right-4 md:group-hover:right-6`} aria-label="Следующий слайд">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <div className="absolute inset-0">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center px-4">
            <div className="hidden flex-1 flex-col items-center justify-center pl-[42%] text-white text-center md:flex lg:pl-[48%] xl:pl-[52%]">
              <div key={`cap-${activeIndex}`} className="fade-in-up">
                <p className="text-xs uppercase tracking-[0.4em] text-white/70">{activeSlide.caption}</p>
                <p className="mt-4 text-4xl font-semibold leading-tight">{activeSlide.brand}</p>
              </div>
              <div key={`high-${activeIndex}`} className="mt-4 flex flex-wrap justify-center gap-3 fade-in-up-200">
                {activeSlide.highlights.map((item) => (
                  <span key={item} className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-6 z-30 flex justify-center gap-2">
        {HERO_SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className={`rounded-full transition-all duration-300 ${
              idx === activeIndex
                ? "h-3 w-3 bg-white"
                : "h-2.5 w-2.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Показать слайд ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

const CertificatesCarousel = () => {
  const CARD_MIN_WIDTH = 200;
  const CARD_GAP = 24;
  const MAX_VISIBLE = 6;
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      setViewportWidth(width);
      const computedVisible = Math.max(
        1,
        Math.min(
          MAX_VISIBLE,
          Math.min(
            CERT_PLACEHOLDERS.length,
            Math.floor((width + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP))
          )
        )
      );
      setVisibleCount(computedVisible);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIndex((prev) => Math.min(prev, Math.max(0, CERT_PLACEHOLDERS.length - visibleCount)));
  }, [visibleCount]);

  const cardWidth = viewportWidth
    ? (viewportWidth - CARD_GAP * Math.max(visibleCount - 1, 0)) / visibleCount
    : CARD_MIN_WIDTH;
  const cardFullWidth = cardWidth + CARD_GAP;
  const trackWidth = cardFullWidth * CERT_PLACEHOLDERS.length - CARD_GAP;
  const maxIndex = Math.max(0, CERT_PLACEHOLDERS.length - visibleCount);
  const offset = index * cardFullWidth;

  const handlePrev = () => setIndex((prev) => Math.max(prev - 1, 0));
  const handleNext = () => setIndex((prev) => Math.min(prev + 1, maxIndex));

  const navButtonBase =
    "absolute top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm border border-white/40 bg-black/40 text-white text-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="group relative w-full" ref={containerRef}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-0 w-32 bg-gradient-to-r from-[#fdf2e9] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-32 bg-gradient-to-l from-[#fdf2e9] to-transparent" />

      <button
        type="button"
        onClick={handlePrev}
        disabled={index === 0}
        className={`${navButtonBase} left-4`}
        aria-label="Предыдущий сертификат"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={handleNext}
        disabled={index === maxIndex}
        className={`${navButtonBase} right-4`}
        aria-label="Следующий сертификат"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <div className="overflow-hidden w-full rounded-[40px] border border-white/40 bg-white/30 p-6 shadow-[0_25px_120px_rgba(8,5,1,0.08)]">
        <div
          className="flex items-stretch gap-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${offset}px)`, width: trackWidth }}
        >
          {CERT_PLACEHOLDERS.map((card, idx) => (
            <div
              key={card.id}
              style={{ width: cardWidth, animationDelay: `${idx * 80}ms` }}
              className="group relative flex-shrink-0 overflow-hidden rounded-[32px] border border-amber-100 bg-white/90 p-4 text-center shadow-[0_35px_80px_rgba(19,12,3,0.12)] transition duration-500 hover:-translate-y-2 hover:border-amber-300 animate-fade-up"
            >
              <div className="relative mx-auto h-48 w-full">
                <Image src={card.image} alt={card.label} fill className="object-contain" sizes="(max-width: 768px) 70vw, 18vw" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-900">
      {callbackOpen && <CallbackModal onClose={() => setCallbackOpen(false)} />}
      <CatalogMegaMenu open={catalogOpen} onClose={() => setCatalogOpen(false)} />
      <div className="sticky top-0 z-[80] border-b border-slate-100 bg-white shadow-lg shadow-slate-900/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4">
          <a href="/" className="flex shrink-0 items-center">
            <Image src="/logo.png" alt="ДомСтрой" width={110} height={52} className="h-12 w-auto object-contain" />
          </a>
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className="flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:text-amber-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Каталог
          </button>
          <div className="relative flex-1">
            <input type="search" placeholder="Поиск" className="h-10 w-full border border-slate-100 bg-slate-50 px-4 pr-10 text-sm outline-none transition focus:border-amber-300 focus:bg-white" />
            <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
          <div className="hidden min-w-32 text-center text-xs text-slate-500 md:block">
            <a href={CONTACTS.phones[0].href} className="block font-semibold text-slate-900 hover:text-amber-600">{CONTACTS.phones[0].label}</a>
            <button type="button" onClick={() => setCallbackOpen(true)} className="uppercase tracking-wide hover:text-amber-600">заказать звонок</button>
          </div>
          <button type="button" aria-label="Избранное" className="relative flex h-10 w-10 shrink-0 items-center justify-center text-slate-500 transition hover:text-amber-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 1 1 6.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 0 1 0-6.364z" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">0</span>
          </button>
          <button type="button" aria-label="Корзина" className="relative flex h-10 w-10 shrink-0 items-center justify-center text-slate-500 transition hover:text-amber-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21h6" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">0</span>
          </button>
          <Link href="/login" className="flex h-10 w-10 items-center justify-center text-slate-500 transition hover:text-amber-600" aria-label="Войти">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
            </svg>
          </Link>
        </div>
      </div>

      <header className="hidden bg-white text-slate-800 border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-2 text-xs md:text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <a href={CONTACTS.phones[0].href} className="font-semibold tracking-wide hover:text-amber-500">
              {CONTACTS.phones[0].label}
            </a>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => setCallbackOpen(true)}
              className="text-slate-500 transition hover:text-amber-500"
            >
              Заказать звонок
            </button>
            <span className="hidden h-4 w-px bg-slate-200 md:block" />
            <a href="https://vk.ru/domstroy_market" className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition" target="_blank" rel="noreferrer">
              <svg className="h-4 w-4" viewBox="0 0 48 48" fill="currentColor"><path d="M41.2 13.6c.3-1 0-1.6-1.3-1.6h-4.4c-1.1 0-1.6.6-1.9 1.2 0 0-2.2 5.5-5.4 9-1 1-1.5 1.4-2.1 1.4-.3 0-.7-.4-.7-1.4V13.6c0-1.1-.3-1.6-1.2-1.6h-6.9c-.7 0-1.1.5-1.1 1 0 1.1 1.6 1.3 1.7 4.3v6.5c0 1.4-.3 1.7-.8 1.7-1.5 0-5.1-5.5-7.2-11.8-.4-1.2-.9-1.7-2-1.7H4.5c-1.2 0-1.5.6-1.5 1.2 0 1.1 1.5 6.7 7 14.1C13.7 33.3 19.4 36 24.6 36c3.2 0 3.6-.7 3.6-1.8v-4c0-1.2.3-1.5 1.1-1.5.6 0 1.7.3 4.2 2.8 2.9 2.9 3.3 4.5 4.9 4.5h4.4c1.2 0 1.8-.6 1.5-1.8-.4-1.2-1.8-2.9-3.6-4.9-1-1.2-2.5-2.4-3-3.1-.6-.8-.4-1.1 0-1.8 0 0 5.2-7.4 5.5-9.8z"/></svg>
              ВКонтакте
            </a>
            <a href="https://t.me/domstroy_market" className="flex items-center gap-1 text-slate-500 hover:text-sky-500 transition" target="_blank" rel="noreferrer">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Телеграм
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {QUICK_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="text-slate-600 hover:text-slate-900" target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
            <span className="hidden h-4 w-px bg-slate-200 md:block" />
            <Link
              href="/login"
              className="group flex items-center gap-1.5 text-slate-600 transition hover:text-slate-900"
              aria-label="Войти в личный кабинет"
            >
              <svg
                className="h-5 w-5 transition group-hover:text-amber-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="transition group-hover:text-amber-500">войти</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-12">
        <HeroCarousel onOpenCatalog={() => setCatalogOpen(true)} />

        {/* 5 карточек-ссылок под каруселью */}
        <section className="section-surface py-8">
          <div className={CONTENT_CONTAINER}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {[
                {
                  label: "РАСПИЛ\nПОГРУЗКА\nКОЛЕРОВКА",
                  href: "https://zv.market/services/",
                  image: "/podcarus/podcarus1.png",
                },
                {
                  label: "ДОСТАВКА",
                  href: "https://zv.market/services/dostavka/",
                  image: "/podcarus/podcarus5.png",
                },
                {
                  label: "НАЛИЧНЫМИ\nБЕЗНАЛИЧНЫМИ\nКРЕДИТ",
                  href: "https://zv.market/help/payment/",
                  image: "/podcarus/podcarus2.png",
                },
                {
                  label: "ВАШЕ\nДОВЕРИЕ —\nНАША РАБОТА",
                  href: "https://zv.market/company/",
                  image: "/podcarus/podcarus3.png",
                },
                {
                  label: "БОЛЕЕ 40 000\nНАИМЕНОВАНИЙ\nТОВАРОВ",
                  href: "https://zv.market/catalog/",
                  image: "/podcarus/podcarus4.png",
                },
              ].map((card) => (
                <a
                  key={card.label}
                  href={card.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group premium-card relative overflow-hidden rounded-xl shadow-sm"
                  style={{ aspectRatio: "1.54" }}
                >
                  <Image
                    src={card.image}
                    alt={card.label.replace(/\n/g, " ")}
                    fill
                    sizes="(min-width:1024px) 20vw,(min-width:640px) 33vw,50vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="whitespace-pre-line text-xs font-bold uppercase leading-snug tracking-wider text-white drop-shadow">
                      {card.label}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>


        <section className="section-surface py-10">
          <div className={CONTENT_CONTAINER}>
            <div className="mb-6 flex flex-col gap-4 text-start lg:flex-row lg:items-end lg:justify-between">
              <SectionTitle title="Лучшие предложения по акции" subtitle="акции" />
              <a href="#" className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-600 transition hover:text-slate-900">
                Весь список товара →
              </a>
            </div>
            <div className="grid gap-4 lg:grid-cols-[480px_1fr]">
              {/* Левое промо-фото */}
              <a href="#" className="premium-card relative overflow-hidden rounded-2xl" style={{ minHeight: 840 }}>
                <Image
                  src="/rem2.png"
                  alt="Акция"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex items-end p-6">
                  <p className="text-4xl font-black uppercase leading-tight text-white drop-shadow-lg">
                    ЛУЧШИЕ<br />ПРЕДЛОЖЕНИЯ<br />ПО АКЦИИ
                  </p>
                </div>
              </a>
              {/* Правая сетка товаров */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {PROMO_PRODUCTS.map((product) => (
                  <div key={product.title} className="premium-card flex flex-col rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                    <div className="flex justify-end">
                      <button type="button" className="text-slate-300 hover:text-red-400 transition">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                        </svg>
                      </button>
                    </div>
                    <div className="mx-auto h-28 w-full overflow-hidden rounded bg-slate-50">
                      <Image src={product.image} alt={product.title} width={200} height={112} className="h-full w-full object-cover" />
                    </div>
                    <p className="mt-2 text-xs font-medium leading-snug text-slate-800 line-clamp-2">{product.title}</p>
                    <p className="mt-1 text-[11px] text-green-600">● В наличии: {product.stock}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{product.price}</span>
                      <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">-{product.discount}%</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-through">{product.oldPrice}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-surface py-12">
          <div className={CONTENT_CONTAINER}>
            <div className="mb-6 flex items-center justify-between">
              <SectionTitle title="Наборы" subtitle="lookbooks" />
              <a
                href="https://zv.market/lookbooks/"
                className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-600 transition hover:text-slate-900"
                target="_blank"
                rel="noreferrer"
              >
                Все наборы →
              </a>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {SETS.map((set) => (
                <a
                  key={set.title}
                  href={set.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group premium-card relative overflow-hidden rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.18)] transition hover:-translate-y-1"
                  style={{
                    backgroundImage: `url(${set.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    aspectRatio: "0.62",
                    minHeight: "360px",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition group-hover:from-black/65"></div>
                  <div className="absolute inset-0 flex flex-col justify-end p-7 text-white">
                    <p className="text-xs uppercase tracking-[0.4em] text-white/70">{set.accent}</p>
                    <h3 className="mt-2 text-2xl font-semibold leading-snug">{set.title}</h3>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section-surface py-10">
          <div className={`${CONTENT_CONTAINER} grid gap-8 lg:grid-cols-[1.1fr_0.9fr]`}>
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-amber-600">о компании</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900">ДомСтрой — всё для ремонта, стройки и благоустройства</h2>
              <p className="mt-3 text-base text-slate-600">
                <strong className="text-slate-800">ДомСтрой</strong> — это магазин строительных и отделочных материалов, где в одном каталоге собраны решения для жилья, коммерческих помещений и участков. Мы работаем для частных клиентов и профессионалов, чтобы нужные позиции были под рукой без лишних поездок и переплат.
              </p>
              <p className="mt-3 text-base text-slate-600">
                В арсенале — смеси, краски, инженерная сантехника, электрика, крепёж, инструмент и отделка. Мы помогаем подобрать комплект, рассчитать объём, организовать доставку, разгрузку и дополнительные услуги, чтобы стройка или ремонт двигались ровно по плану.
              </p>
              <Link
                href="/company"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 transition hover:text-amber-700"
              >
                Подробнее
                <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="flex items-center justify-center">
              <div className="premium-card w-full max-w-lg rounded-3xl border border-slate-100 bg-gradient-to-br from-amber-50 via-white to-slate-50 p-1 shadow-xl">
                <div className="relative overflow-hidden rounded-[22px] bg-slate-900/90">
                  <div className="h-64 w-full bg-gradient-to-br from-rose-500 to-amber-500 opacity-80"></div>
                  <button
                    type="button"
                    className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition hover:bg-amber-400"
                    aria-label="Смотреть видео о компании"
                  >
                    ▶
                  </button>
                  <div className="absolute bottom-6 left-6 text-white">
                    <p className="text-sm uppercase tracking-[0.4em] text-white/70">ДомСтрой</p>
                    <p className="text-2xl font-semibold">Стройматериалы по честным ценам</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-surface py-12">
          <div className={CONTENT_CONTAINER}>
            <div className="mb-6 flex items-center justify-between">
              <SectionTitle title="Бренды" subtitle="партнёры" />
              <Link
                href={BRAND_LINKS[0].href}
                className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-600 transition hover:text-slate-900"
              >
                Все бренды →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {BRANDS.map((brand) => (
                <div
                  key={brand.name}
                  className="group premium-card flex h-24 items-center justify-center rounded-xl border border-slate-100 bg-white px-4 shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
                >
                  <Image
                    src={brand.logo}
                    alt={`Логотип ${brand.name}`}
                    width={160}
                    height={64}
                    className="max-h-14 w-auto max-w-full object-contain opacity-80 transition group-hover:opacity-100 group-hover:scale-105"
                    style={{ imageRendering: "auto" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative w-full overflow-hidden bg-gradient-to-r from-[#fdf7ef] via-[#fffaf4] to-[#fdf7ef] py-20">
          <div className={`${CONTENT_CONTAINER} mb-4`}>
            <div className="flex flex-col gap-4 text-start lg:flex-row lg:items-start lg:justify-between">
              <SectionTitle title="Сертификаты и награды" subtitle="карусель" className="mb-0" />
              <Link href={BRAND_LINKS[1].href} className="pt-5 text-xs font-semibold uppercase tracking-[0.35em] text-amber-600 transition hover:text-slate-900">
                Все сертификаты →
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full px-4 sm:px-6 lg:px-12">
            <CertificatesCarousel />
          </div>
        </section>

        <section className="map-section">
          <div className={`${CONTENT_CONTAINER} flex flex-col gap-4 py-10`}>
            <SectionTitle title="Наш магазин ДомСтрой на карте" subtitle="как доехать" />
          </div>
          <div className="map-frame">
            <iframe
              src="https://yandex.ru/map-widget/v1/-/CTqv7Dnm"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="ДомСтрой на карте"
            />
          </div>
        </section>
      </main>

      <footer className="bg-[#f0ebe3] py-12 text-slate-900">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-xs uppercase tracking-[0.4em] text-amber-600/80">{column.title}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <a href={item.href} className="hover:text-amber-600" target="_blank" rel="noreferrer">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-2 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} ДомСтрой — комплексные поставки строительных материалов</div>
            <div className="flex flex-wrap items-center gap-3">
              <a href="tel:88002507626" className="hover:text-amber-600">
                8 800 250 76 26
              </a>
              <a href="tel:84997025545" className="hover:text-amber-600">
                8 499 702 55 45
              </a>
              <a href="mailto:info@domstroy.market" className="hover:text-amber-600">
                info@domstroy.market
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
