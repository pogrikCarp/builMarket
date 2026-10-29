"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
  alt: string;
};

export default function ProductGallery({ images, alt }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return <div className="aspect-square w-full min-w-0 rounded-2xl bg-white" />;
  }

  return (
    <div className="w-full min-w-0 max-w-full self-start">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white">
        <Image
          src={images[activeIndex]}
          alt={alt}
          fill
          className="object-contain p-4 sm:p-6"
          sizes="(min-width: 1280px) 604px, (min-width: 1024px) calc(50vw - 36px), calc(100vw - 32px)"
          unoptimized
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex w-full min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-2" role="group" aria-label="Фотографии товара">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              aria-label={`Фото ${index + 1} из ${images.length}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition ${
                index === activeIndex ? "border-amber-500" : "border-slate-200 hover:border-amber-300"
              }`}
            >
              <Image src={src} alt={`${alt} ${index + 1}`} fill className="object-contain p-1" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
