"use client";

import Image from "next/image";
import { useRef, useState, type MouseEvent, type TouchEvent } from "react";

type Props = {
  images: string[];
  alt: string;
};

// Порог в пикселях, после которого движение пальца считается свайпом,
// а не случайным дрожанием руки при обычном тапе.
const SWIPE_THRESHOLD = 18;

/**
 * Карточка товара с несколькими фото: на десктопе наведение курсора на разные части
 * картинки переключает фото (как на zv.market), на мобильных — горизонтальный свайп.
 * Обычный тап/клик (без свайпа) продолжает открывать карточку товара как раньше.
 */
export default function ProductCardMedia({ images, alt }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);
  const hasMultiple = images.length > 1;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!hasMultiple) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.min(images.length - 1, Math.max(0, Math.floor(ratio * images.length)));
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    if (!hasMultiple) return;
    setActiveIndex(0);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!hasMultiple) return;
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    didSwipeRef.current = false;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!hasMultiple || !touchStartRef.current) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    if (Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      didSwipeRef.current = true;
      setActiveIndex((prev) => Math.min(images.length - 1, Math.max(0, prev + (deltaX < 0 ? 1 : -1))));
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // Если фото переключалось свайпом — гасим последующий клик, чтобы не открывать товар.
  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (didSwipeRef.current) {
      event.preventDefault();
      event.stopPropagation();
      didSwipeRef.current = false;
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-300">
          Фото
          <br />
          скоро
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClickCapture={handleClickCapture}
    >
      <Image
        src={images[activeIndex]}
        alt={alt}
        fill
        className="object-contain p-2"
        sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 26vw, (min-width: 640px) 45vw, 100vw"
        unoptimized
      />
      {hasMultiple && (
        <div className="pointer-events-none absolute inset-x-0 bottom-1.5 flex items-center justify-center gap-1">
          {images.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-4 bg-amber-500" : "w-1.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
