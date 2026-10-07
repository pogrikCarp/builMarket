"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

type MetrikaWindow = Window & {
  ym?: (
    counterId: number,
    method: "hit",
    url: string,
    options: { title: string; referer: string }
  ) => void;
};

export default function YandexMetrikaPageViews({ counterId }: { counterId: number }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const lastViewedUrl = useRef<string | null>(null);

  useEffect(() => {
    // defer отключает автоматический просмотр при init. Здесь отправляем один
    // hit при первом открытии и при переходах Next.js, включая разделы каталога.
    const frame = window.requestAnimationFrame(() => {
      const metrikaWindow = window as MetrikaWindow;
      const url = window.location.href;
      if (!metrikaWindow.ym || lastViewedUrl.current === url) return;

      metrikaWindow.ym(counterId, "hit", url, {
        title: document.title,
        referer: lastViewedUrl.current ?? document.referrer,
      });
      lastViewedUrl.current = url;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [counterId, pathname, query]);

  return null;
}
