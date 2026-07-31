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
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 via-white to-slate-200">
        <div className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
          Фото
          <br />
          скоро
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Image
          src={images[activeIndex]}
          alt={alt}
          fill
          className="object-contain p-6"
          sizes="(min-width: 1024px) 40vw, 100vw"
          unoptimized
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
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
