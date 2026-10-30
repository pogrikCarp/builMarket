"use client";

import { useSyncExternalStore } from "react";
import DesktopCatalogBrowser, { type CatalogBrowserProps } from "@/components/catalog/DesktopCatalogBrowser";
import MobileCatalogBrowser from "@/components/catalog/MobileCatalogBrowser";
import styles from "@/components/catalog/Catalog.module.css";

const PHONE_QUERY = "(width < 768px)";

function subscribeToViewport(onChange: () => void) {
  const media = window.matchMedia(PHONE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const getMobileSnapshot = () => window.matchMedia(PHONE_QUERY).matches;
const getServerSnapshot = () => false;

type Props = CatalogBrowserProps & { initialView?: "products" | "categories" };

export default function CatalogBrowser(props: Props) {
  // Render the existing desktop catalog on the server. On phones, the media
  // subscription mounts the mobile interface with the very same server data.
  // Only one catalog view is mounted, so there are no duplicate catalog requests.
  const isMobile = useSyncExternalStore(subscribeToViewport, getMobileSnapshot, getServerSnapshot);

  if (isMobile) return <MobileCatalogBrowser {...props} />;

  return <>
    <div className={styles.desktopOnly}><DesktopCatalogBrowser {...props} /></div>
    <div className={styles.mobileLoading} role="status">Загружаем каталог…</div>
  </>;
}
