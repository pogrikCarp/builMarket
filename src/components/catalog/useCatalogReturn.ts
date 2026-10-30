"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { readCatalogReturn, writeCatalogReturn } from "@/lib/catalog-return";

export default function useCatalogReturn({ url, incomingUrl, ready, synchronize }: {
  url: string; incomingUrl: string; ready: boolean; synchronize: (url: string) => void;
}) {
  const router = useRouter();
  const leaving = useRef(false);
  const destination = useRef<{ url: string; productId: string } | null>(null);

  useEffect(() => {
    const next = destination.current;
    if (!next || next.url !== incomingUrl) return;
    destination.current = null;
    router.push(`/catalog/${next.productId}`);
  }, [incomingUrl, router]);

  useEffect(() => {
    if (!ready || leaving.current) return;
    const saved = readCatalogReturn();
    if (!saved?.pending || saved.url !== incomingUrl) return;
    let frame = 0;
    let settled = 0;
    let stopped = false;
    const stop = () => { stopped = true; cancelAnimationFrame(frame); clearTimeout(settled); observer.disconnect(); };
    const restore = () => {
      if (stopped) return;
      const view = document.querySelector("[data-catalog-view]");
      if (!view?.getClientRects().length) return;
      const anchor = document.getElementById(`catalog-product-${saved.productId}`);
      if (anchor && !anchor.getClientRects().length) return;
      if (!anchor && document.body.scrollHeight < saved.scrollY + window.innerHeight) return;
      const target = anchor ? Math.max(0, window.scrollY + anchor.getBoundingClientRect().top - saved.offset) : saved.scrollY;
      window.scrollTo({ top: target, behavior: "instant" });
      writeCatalogReturn({ ...saved, pending: false });
      // The seasonal header loads asynchronously and can grow after hydration.
      // Keep the card aligned through that layout change; user input cancels it.
      clearTimeout(settled);
      settled = window.setTimeout(stop, 750);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { frame = requestAnimationFrame(restore); }); };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    schedule();
    const timeout = window.setTimeout(stop, 3000);
    window.addEventListener("touchstart", stop, { once: true, passive: true });
    window.addEventListener("wheel", stop, { once: true, passive: true });
    window.addEventListener("keydown", stop, { once: true });
    return () => {
      stop(); clearTimeout(timeout);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [incomingUrl, ready]);

  const navigateToProduct = (event: { preventDefault: () => void }, productId: string) => {
    leaving.current = true;
    const anchor = document.getElementById(`catalog-product-${productId}`);
    writeCatalogReturn({ url, productId, scrollY: window.scrollY, offset: anchor?.getBoundingClientRect().top ?? 0, savedAt: Date.now(), pending: true });
    if (url !== incomingUrl) {
      event.preventDefault();
      // Finish the pending filter/page URL before leaving: browser Back must
      // receive the same server payload, including a very fast card click.
      destination.current = { url, productId };
      synchronize(url);
    }
  };
  return { leaving, navigateToProduct };
}
