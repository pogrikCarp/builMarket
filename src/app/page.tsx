"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import CartButton from "@/components/cart/CartButton";
import { LOOKBOOKS } from "@/lib/lookbooks";
import { buildFolderTree } from "@/lib/folder-tree";
import SiteFooter from "@/components/SiteFooter";
import { PROMO_PRODUCTS } from "@/lib/promo-products";

type LinkItem = { label: string; href: string };
type HomeMedia = {
  id: string;
  type: "HERO" | "LOOKBOOK" | "CERTIFICATE" | "BRAND";
  title: string;
  image: string | null;
  sortOrder: number;
};

const CONTACTS = {
  phones: [
    { label: "+7 916 004-55-22", href: "tel:+79160045522" },
    { label: "+7 916 004-55-22", href: "tel:+79160045522", note: "Звонок бесплатный" },
  ],
  email: { label: "domstroy.dmd@mail.ru", href: "mailto:domstroy.dmd@mail.ru" },
};

const SOCIAL_LINKS: LinkItem[] = [
  { label: "ВКонтакте", href: "https://vk.ru/domstroy_market" },
  { label: "Telegram", href: "https://t.me/domstroy_market" },
];

const QUICK_LINKS: LinkItem[] = [
  { label: "Акция дня", href: "/promo" },
];

const HEADER_ACTIONS = [
  { label: "Войти", sub: "личный кабинет" },
  { label: "Избранное", sub: "0 товаров" },
  { label: "Корзина", sub: "0 ₽" },
];

const SETS = LOOKBOOKS.map((lookbook) => ({
  title: lookbook.title,
  href: `/lookbooks/${lookbook.slug}`,
  accent: lookbook.accent,
  image: lookbook.image,
  imagePosition: lookbook.imagePosition ?? "top",
}));

const BRAND_LINKS: LinkItem[] = [
  { label: "Все бренды", href: "/brands" },
  { label: "Все сертификаты", href: "/certificates" },
];

const BRANDS: { name: string; logo: string }[] = [
  { name: "Fengbao", logo: "/comp/1fengbao.webp" },
  { name: "Edon", logo: "/comp/edon.jpg" },
  { name: "Redbo", logo: "/comp/redbo.jpg" },
  { name: "Бренд 4", logo: "/comp/comp1.jpg" },
  { name: "Бренд 5", logo: "/comp/comp2.jpg" },
  { name: "Бренд 6", logo: "/comp/comp3.png" },
  { name: "Бренд 7", logo: "/comp/comp4.jpg" },
  { name: "Бренд 8", logo: "/comp/comp5.png" },
  { name: "Бренд 9", logo: "/comp/comp6.jpg" },
  { name: "Бренд 10", logo: "/comp/comp7.jpg" },
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
    brand: "ЭЛЕКТРОИНСТРУМЕНТЫ",
    caption: "Прямые поставки с Китая",
    image: "/banner4.png",
    highlights: ["Fengbao", "Edon", "Redbo"],
  },
  {
    id: 2,
    brand: "ЩЕБЕНЬ И ПЕСОК",
    caption: "Домстрой — прямые поставки с карьера",
    image: "/main3.png",
    highlights: ["Щебень разных фракций", "Карьерный и мытый песок", "Доставка на объект"],
  },
  {
    id: 3,
    brand: "ТЕХНОНИКОЛЬ",
    caption: "Доставка комплектов под ключ",
    image: "/car2.png",
    highlights: ["Доставим за 24 часа", "Самовывоз со склада", "Онлайн отслеживание"],
  },
  {
    id: 4,
    brand: "KNAUF",
    caption: "Инженерные решения для сантехники",
    image: "/car3.png",
    highlights: ["Водоснабжение", "Отопление", "Монтаж инженерии"],
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

type MsFolder = {
  id: string;
  name: string;
  meta: { href: string };
  pathName?: string;
  productFolder?: { meta: { href: string } };
};

type FolderGroup = {
  id: string;
  title: string;
  folder: MsFolder;
  children: MsFolder[];
};

const CatalogMegaMenu = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [folders, setFolders] = useState<MsFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Каждый корневой раздел МойСклад становится группой в левом меню,
  // а его подкатегории (найденные по ссылке productFolder.meta.href) — подпунктами справа.
  const { roots, childrenByParent } = useMemo(() => buildFolderTree(folders), [folders]);

  const groups = useMemo<FolderGroup[]>(
    () =>
      roots
        .map((root) => ({
          id: root.id,
          title: root.name,
          folder: root,
          children: (childrenByParent.get(root.meta.href) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name, "ru")),
        }))
        .sort((a, b) => a.title.localeCompare(b.title, "ru")),
    [roots, childrenByParent]
  );

  const activeGroup = useMemo(() => groups.find((group) => group.id === activeGroupId) ?? null, [groups, activeGroupId]);

  useEffect(() => {
    if (!groups.length) return;
    if (!activeGroupId || !groups.some((group) => group.id === activeGroupId)) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);

  useEffect(() => {
    if (!open) return;
    setLoadingFolders(true);
    fetch("/api/moysklad/folders")
      .then((r) => r.json())
      .then((foldersData) => {
        setFolders(foldersData.rows ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingFolders(false));
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleGroupSelect = (group: FolderGroup) => {
    setActiveGroupId(group.id);
  };

  const getFolderHref = (folder: MsFolder) => `/catalog?folder=${encodeURIComponent(folder.id)}`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto flex h-full w-full max-w-7xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-500">Каталог</p>
            {activeGroup && (
              <>
                <span className="text-slate-300">/</span>
                <p className="text-sm font-semibold text-slate-800">{activeGroup.title}</p>
              </>
            )}
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:text-slate-900" aria-label="Закрыть">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {loadingFolders ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar групп */}
            <aside className="w-48 shrink-0 overflow-y-auto border-r border-slate-100 py-4 sm:w-56 md:w-60">
              <p className="px-5 pb-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Группы товаров</p>
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleGroupSelect(group)}
                  className={`flex w-full items-center gap-2 px-5 py-2.5 text-left text-sm transition ${
                    activeGroupId === group.id
                      ? "bg-amber-50 font-semibold text-amber-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <svg className="h-4 w-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5A1 1 0 0011.121 7H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>
                  <span className="leading-tight">{group.title}</span>
                </button>
              ))}
            </aside>

            {/* Область подгрупп и товаров */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-500">Подгруппы</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{activeGroup?.title ?? "Каталог"}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/catalog"
                      onClick={onClose}
                      className="rounded-full border border-transparent bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                    >
                      Открыть каталог →
                    </Link>
                  </div>
                </div>
                <div className="mt-6 max-h-[calc(100vh-14rem)] overflow-y-auto pr-2">
                  {activeGroup ? (
                    <div className="flex flex-col gap-6">
                      <Link
                        href={getFolderHref(activeGroup.folder)}
                        onClick={onClose}
                        className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 transition hover:text-amber-600"
                      >
                        Все товары раздела «{activeGroup.title}»
                        <span aria-hidden>→</span>
                      </Link>
                      {activeGroup.children.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Подкатегории</p>
                          <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {activeGroup.children.map((child) => (
                              <Link
                                key={child.id}
                                href={getFolderHref(child)}
                                onClick={onClose}
                                className="text-sm leading-snug text-slate-500 transition hover:text-amber-600"
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Для этой группы пока нет подгрупп</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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

const HeroCarousel = ({ slides }: { slides: typeof HERO_SLIDES }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isSwipeRef = useRef(false);
  const activeSlide = slides[activeIndex] ?? slides[0];

  const goPrev = () => setActiveIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  const goNext = () => setActiveIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleResize = () => setContainerWidth(container.clientWidth);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length, activeIndex]);

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isSwipeRef.current = false;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    const deltaY = e.touches[0].clientY - touchStartYRef.current;
    if (!isSwipeRef.current && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 6) {
      isSwipeRef.current = true;
    }
    if (isSwipeRef.current) {
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    const threshold = Math.max(48, containerWidth * 0.12);
    if (dragOffset <= -threshold) {
      goNext();
    } else if (dragOffset >= threshold) {
      goPrev();
    }
    setIsDragging(false);
    setDragOffset(0);
  };

  const arrowButtonBase =
    "absolute top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm border border-white/40 bg-black/40 text-white text-lg opacity-0 transition-opacity duration-300 sm:flex sm:group-hover:opacity-100";

  return (
    <section className="relative w-full overflow-hidden">
      <div
        ref={containerRef}
        className="group relative h-[320px] w-full touch-pan-y select-none overflow-hidden bg-slate-900 sm:h-[420px] md:h-[520px] lg:h-[600px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full w-full"
          style={{
            transform: `translate3d(${-activeIndex * containerWidth + dragOffset}px, 0, 0)`,
            transition: isDragging ? "none" : "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {slides.map((slide, idx) => (
            <div key={slide.id} className="relative h-full w-full shrink-0">
              <Image
                src={slide.image}
                alt={slide.brand}
                fill
                priority={idx === 0}
                quality={100}
                sizes="100vw"
                draggable={false}
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />

        <button type="button" onClick={goPrev} className={`${arrowButtonBase} sm:-left-12 sm:group-hover:left-4 md:group-hover:left-6`} aria-label="Предыдущий слайд">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button type="button" onClick={goNext} className={`${arrowButtonBase} sm:-right-12 sm:group-hover:right-4 md:group-hover:right-6`} aria-label="Следующий слайд">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <div className="pointer-events-none absolute inset-0">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center px-4">
            <div className="flex flex-1 flex-col items-start justify-end pb-8 text-white md:items-center md:justify-center md:pl-[42%] md:text-center md:pb-0 lg:pl-[48%] xl:pl-[52%]">
              <div key={`cap-${activeIndex}`} className="fade-in-up">
                <p className="text-xs uppercase tracking-[0.4em] text-white/70">{activeSlide.caption}</p>
                <p className="mt-2 text-2xl font-semibold leading-tight sm:mt-4 sm:text-3xl md:text-4xl">{activeSlide.brand}</p>
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
        {slides.map((slide, idx) => (
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

type CertificateCard = { id: string | number; label: string; image: string };

const CertificatesCarousel = ({ cards }: { cards: CertificateCard[] }) => {
  const CARD_MIN_WIDTH = 200;
  const CARD_GAP = 24;
  const MAX_VISIBLE = 6;
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const width = container.clientWidth;
      setViewportWidth(width);
      const computedVisible = Math.max(
        1,
        Math.min(
          MAX_VISIBLE,
          Math.min(
            cards.length,
            Math.floor((width + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP))
          )
        )
      );
      setVisibleCount(computedVisible);
      setIndex((prev) => Math.min(prev, Math.max(0, cards.length - computedVisible)));
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();
    return () => resizeObserver.disconnect();
  }, [cards.length]);

  const cardWidth = viewportWidth
    ? (viewportWidth - CARD_GAP * Math.max(visibleCount - 1, 0)) / visibleCount
    : CARD_MIN_WIDTH;
  const cardFullWidth = cardWidth + CARD_GAP;
  const trackWidth = cardFullWidth * cards.length - CARD_GAP;
  const maxIndex = Math.max(0, cards.length - visibleCount);
  const offset = index * cardFullWidth;

  const handlePrev = () => setIndex((prev) => Math.max(prev - 1, 0));
  const handleNext = () => setIndex((prev) => Math.min(prev + 1, maxIndex));

  const navButtonBase =
    "absolute top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/55 text-lg text-white opacity-100 shadow-lg transition duration-300 hover:bg-black/75 md:opacity-0 md:group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="group relative w-full min-w-0">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden w-32 bg-gradient-to-r from-[#fdf2e9] to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-32 bg-gradient-to-l from-[#fdf2e9] to-transparent sm:block" />

      <button
        type="button"
        onClick={handlePrev}
        disabled={index === 0}
        className={`${navButtonBase} left-2 sm:left-4`}
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
        className={`${navButtonBase} right-2 sm:right-4`}
        aria-label="Следующий сертификат"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-white/40 bg-white/30 p-3 shadow-[0_25px_120px_rgba(8,5,1,0.08)] sm:rounded-[40px] sm:p-6">
        <div ref={containerRef} className="w-full min-w-0 overflow-hidden">
          <div
            className="flex items-stretch gap-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(-${offset}px)`, width: trackWidth }}
          >
          {cards.map((card, idx) => (
            <div
              key={card.id}
              style={{ width: cardWidth, animationDelay: `${idx * 80}ms` }}
              className="group relative flex-shrink-0 overflow-hidden rounded-[32px] border border-amber-100 bg-white/90 p-4 text-center shadow-[0_35px_80px_rgba(19,12,3,0.12)] transition duration-500 hover:-translate-y-2 hover:border-amber-300 animate-fade-up"
            >
              <div className="relative mx-auto h-44 w-full sm:h-48">
                <Image src={card.image} alt={card.label} fill className="object-contain" sizes="(max-width: 640px) calc(100vw - 56px), 18vw" />
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [homeMedia, setHomeMedia] = useState<HomeMedia[]>([]);

  useEffect(() => {
    fetch("/api/home-content")
      .then((response) => (response.ok ? response.json() : { content: [] }))
      .then((data) => setHomeMedia(data.content ?? []))
      .catch(() => setHomeMedia([]));
  }, []);

  const heroSlides = useMemo(
    () => HERO_SLIDES.map((slide, index) => ({ ...slide, image: homeMedia.find((item) => item.type === "HERO" && item.sortOrder === index)?.image || slide.image })),
    [homeMedia]
  );
  const sets = useMemo(
    () => SETS.map((set, index) => ({ ...set, image: homeMedia.find((item) => item.type === "LOOKBOOK" && item.sortOrder === index)?.image || set.image })),
    [homeMedia]
  );
  const certificates = useMemo(
    () => [
      ...CERT_PLACEHOLDERS.map((certificate, index) => ({
        ...certificate,
        image: homeMedia.find((item) => item.type === "CERTIFICATE" && item.sortOrder === index)?.image || certificate.image,
      })),
      ...homeMedia
        .filter((item) => item.type === "CERTIFICATE" && item.sortOrder >= CERT_PLACEHOLDERS.length && item.image)
        .map((item) => ({ id: item.id, label: item.title, image: item.image as string })),
    ],
    [homeMedia]
  );
  const brands = useMemo(
    () => [
      ...BRANDS.map((brand, index) => ({
        ...brand,
        logo: homeMedia.find((item) => item.type === "BRAND" && item.sortOrder === index)?.image || brand.logo,
      })),
      ...homeMedia
        .filter((item) => item.type === "BRAND" && item.sortOrder >= BRANDS.length && item.image)
        .map((item) => ({ name: item.title, logo: item.image as string })),
    ],
    [homeMedia]
  );

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-900">
      {callbackOpen && <CallbackModal onClose={() => setCallbackOpen(false)} />}
      <div className="sticky top-0 z-[80] border-b border-slate-100 bg-white shadow-lg shadow-slate-900/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:gap-5 sm:px-4">
          <a href="/" className="flex shrink-0 items-center">
            <Image src="/logo.png" alt="ДомСтрой" width={110} height={52} className="h-10 w-auto object-contain sm:h-12" />
          </a>
          <Link
            href="/catalog"
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-slate-800 transition hover:text-amber-600 sm:px-3"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="hidden sm:inline">Каталог</span>
          </Link>
          <div className="relative hidden flex-1 sm:block">
            <input type="search" placeholder="Поиск" className="h-10 w-full border border-slate-100 bg-slate-50 px-4 pr-10 text-sm outline-none transition focus:border-amber-300 focus:bg-white" />
            <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
          <div className="flex-1 sm:hidden" />
          <div className="hidden min-w-32 text-center text-xs text-slate-500 lg:block">
            <a href={CONTACTS.phones[0].href} className="block font-semibold text-slate-900 hover:text-amber-600">{CONTACTS.phones[0].label}</a>
            <button type="button" onClick={() => setCallbackOpen(true)} className="uppercase tracking-wide hover:text-amber-600">заказать звонок</button>
          </div>
          <button type="button" aria-label="Поиск" className="flex h-10 w-10 shrink-0 items-center justify-center text-slate-500 transition hover:text-amber-600 sm:hidden">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>
          <button type="button" aria-label="Избранное" className="relative hidden h-10 w-10 shrink-0 items-center justify-center text-slate-500 transition hover:text-amber-600 sm:flex">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 1 1 6.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 0 1 0-6.364z" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">0</span>
          </button>
          <CartButton />
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
        <HeroCarousel slides={heroSlides} />

        {/* 5 карточек-ссылок под каруселью */}
        <section className="section-surface py-8">
          <div className={CONTENT_CONTAINER}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {[
                {
                  label: "РАСПИЛ\nПОГРУЗКА\nКОЛЕРОВКА",
                  href: "/services",
                  image: "/podcarus/podcarus1.png",
                },
                {
                  label: "ДОСТАВКА",
                  href: "/services/dostavka",
                  image: "/podcarus/podcarus5.png",
                },
                {
                  label: "НАЛИЧНЫМИ\nБЕЗНАЛИЧНЫМИ\nКРЕДИТ",
                  href: "/help/payment",
                  image: "/podcarus/podcarus2.png",
                },
                {
                  label: "ВАШЕ\nДОВЕРИЕ —\nНАША РАБОТА",
                  href: "/company",
                  image: "/podcarus/podcarus3.png",
                },
                {
                  label: "БОЛЕЕ 40 000\nНАИМЕНОВАНИЙ\nТОВАРОВ",
                  href: "/catalog",
                  image: "/podcarus/podcarus4.png",
                },
              ].map((card) => (
                <Link
                  key={card.label}
                  href={card.href}
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
                </Link>
              ))}
            </div>
          </div>
        </section>


        <section className="section-surface py-10">
          <div className={CONTENT_CONTAINER}>
            <div className="mb-6 flex flex-col gap-4 text-start lg:flex-row lg:items-end lg:justify-between">
              <SectionTitle title="Лучшие предложения по акции" subtitle="акции" />
              <Link href="/catalog?section=promo" className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600 transition hover:text-slate-900 sm:tracking-[0.35em]">
                Весь список товара →
              </Link>
            </div>
            <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
              {/* Левое промо-фото */}
              <a href="#" className="premium-card relative hidden overflow-hidden rounded-2xl lg:block" style={{ minHeight: 480 }}>
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
            <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
              <SectionTitle title="Наборы" subtitle="lookbooks" className="mb-0" />
              <Link
                href="/lookbooks"
                className="shrink-0 text-xs font-semibold uppercase tracking-[0.25em] text-amber-600 transition hover:text-slate-900 sm:pt-5 sm:tracking-[0.35em]"
              >
                Все наборы →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {sets.map((set) => (
                <Link
                  key={set.title}
                  href={set.href}
                  className="group premium-card relative overflow-hidden rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.18)] transition hover:-translate-y-1"
                  style={{
                    backgroundImage: `url(${set.image})`,
                    backgroundColor: "#0b0907",
                    backgroundSize: "120%",
                    backgroundPosition: set.imagePosition,
                    backgroundRepeat: "no-repeat",
                    aspectRatio: "0.72",
                    minHeight: "320px",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition group-hover:from-black/65"></div>
                  <div className="absolute inset-0 flex flex-col justify-end p-5 text-white sm:p-7">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/70 sm:text-xs sm:tracking-[0.4em]">{set.accent}</p>
                    <h3 className="mt-2 text-xl font-semibold leading-snug sm:text-2xl">{set.title}</h3>
                  </div>
                </Link>
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
            <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
              <SectionTitle title="Бренды" subtitle="партнёры" className="mb-0" />
              <Link
                href={BRAND_LINKS[0].href}
                className="shrink-0 text-xs font-semibold uppercase tracking-[0.25em] text-amber-600 transition hover:text-slate-900 sm:pt-5 sm:tracking-[0.35em]"
              >
                Все бренды →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {brands.map((brand, idx) => (
                <div
                  key={brand.name}
                  className="group premium-card flex h-24 items-center justify-center rounded-xl border border-slate-100 bg-white px-4 shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
                >
                  <Image
                    src={brand.logo}
                    alt={`Логотип ${brand.name}`}
                    width={idx === 0 ? 300 : 160}
                    height={idx === 0 ? 96 : 64}
                    className={`object-contain opacity-80 transition group-hover:opacity-100 group-hover:scale-105 ${
                      idx === 0 ? "max-h-16 w-auto max-w-full" : "max-h-14 w-auto max-w-full"
                    }`}
                    style={{ imageRendering: "auto" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative w-full overflow-hidden bg-gradient-to-r from-[#fdf7ef] via-[#fffaf4] to-[#fdf7ef] py-12 sm:py-20">
          <div className={`${CONTENT_CONTAINER} mb-4`}>
            <div className="flex flex-col gap-4 text-start lg:flex-row lg:items-start lg:justify-between">
              <SectionTitle title="Сертификаты и награды" subtitle="карусель" className="mb-0" />
              <Link href={BRAND_LINKS[1].href} className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600 transition hover:text-slate-900 sm:tracking-[0.35em] lg:pt-5">
                Все сертификаты →
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full px-4 sm:px-6 lg:px-12">
            <CertificatesCarousel cards={certificates} />
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

      <SiteFooter />
    </div>
  );
}
