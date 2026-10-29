"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import styles from "./Catalog.module.css";

type Props = { open: boolean; onClose: () => void; count: number; children: ReactNode };

export default function CatalogFilterDialog({ open, onClose, count, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    const previousOverflow = document.body.style.overflowY;
    document.body.style.overflowY = "hidden";
    return () => { document.body.style.overflowY = previousOverflow; };
  }, [open]);

  return <dialog ref={dialogRef} className={styles.filterDialog} aria-labelledby="catalog-filter-title"
    onClose={onClose} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={styles.filterDialogContent}>
      <div className={styles.filterDialogHeader}>
        <h2 id="catalog-filter-title">Фильтры</h2>
        <button type="button" aria-label="Закрыть фильтры" onClick={onClose}><XMarkIcon className={styles.icon} aria-hidden="true" /></button>
      </div>
      <div className={styles.filterDialogBody}>{children}</div>
      <div className={styles.filterDialogFooter}>
        <button type="button" onClick={onClose}>Показать товары · {count}</button>
      </div>
    </div>
  </dialog>;
}
