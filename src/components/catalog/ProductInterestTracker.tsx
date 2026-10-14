"use client";

import { useEffect } from "react";
import { recordCatalogInterest } from "@/lib/catalog-interest-client";

export default function ProductInterestTracker({ productId }: { productId: string }) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      if (document.visibilityState === "visible") {
        timer = setTimeout(() => recordCatalogInterest(productId, "VIEW"), 3000);
      }
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [productId]);

  return null;
}
