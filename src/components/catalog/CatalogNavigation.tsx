"use client";

import Link from "next/link";
import {
  ArrowRightIcon, BoltIcon, BuildingOffice2Icon, ChevronLeftIcon, ChevronRightIcon,
  CubeIcon, HomeModernIcon, Squares2X2Icon, SunIcon, TagIcon, TruckIcon, WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import type { MoyskladProductFolder } from "@/lib/moysklad";
import { buildFolderTree, getFolderPath } from "@/lib/folder-tree";
import styles from "./Catalog.module.css";

type Folder = MoyskladProductFolder;
type Props = {
  folders: Folder[];
  navigationFolder: Folder | null;
  onBrowse: (folder: Folder | null) => void;
  onSelect: (folder: Folder) => void;
  onAll: () => void;
  onPromo: () => void;
};

function FolderIcon({ name }: { name: string }) {
  const Icon = /авто/i.test(name) ? TruckIcon
    : /электр/i.test(name) ? BoltIcon
    : /ручн|креп|инструмент/i.test(name) ? WrenchScrewdriverIcon
    : /сад/i.test(name) ? SunIcon
    : /строит/i.test(name) ? BuildingOffice2Icon
    : /сантех|отоп|насос|вент/i.test(name) ? HomeModernIcon : CubeIcon;
  return <Icon aria-hidden="true" className={styles.icon} />;
}

export function CatalogDirectory(props: Props) {
  const { roots, childrenByParent } = buildFolderTree(props.folders);
  const folder = props.navigationFolder;
  const path = folder ? getFolderPath(folder, props.folders) : [];
  const parent = path.length > 1 ? path[path.length - 2] : null;
  const children = folder ? childrenByParent.get(folder.meta.href) ?? [] : roots;

  const categoryLink = (category: Folder, className: string) => {
    const nested = childrenByParent.get(category.meta.href) ?? [];
    return <Link href={`/catalog?folder=${category.id}`} prefetch={false} className={className}
      onNavigate={(event) => {
        event.preventDefault();
        if (nested.length) props.onBrowse(category);
        else props.onSelect(category);
      }}>
      <span>{category.name}</span><ChevronRightIcon className={styles.chevron} aria-hidden="true" />
    </Link>;
  };

  return <section className={styles.directory} aria-label="Выбор категории">
    <div className={styles.directoryHeading}>
      <div>
        {folder && <button type="button" className={styles.backLink} onClick={() => props.onBrowse(parent)}>
          <ChevronLeftIcon className={styles.icon} aria-hidden="true" />{parent?.name ?? "Все разделы"}
        </button>}
        <h2>{folder?.name ?? "Все разделы каталога"}</h2>
      </div>
      {folder && <Link href={`/catalog?folder=${folder.id}`} prefetch={false} className={styles.sectionAction}
        onNavigate={(event) => { event.preventDefault(); props.onSelect(folder); }}>
        Все товары раздела<ArrowRightIcon className={styles.icon} aria-hidden="true" />
      </Link>}
    </div>

    <div className={styles.mobileCategoryList}>
      {!folder && <div className={styles.mobileUtilities}>
        <button type="button" onClick={props.onAll}><Squares2X2Icon className={styles.icon} aria-hidden="true" />Все товары</button>
        <button type="button" onClick={props.onPromo}><TagIcon className={styles.icon} aria-hidden="true" />Акции</button>
      </div>}
      {children.map((child) => <div key={child.id} className={styles.mobileCategory}>
        {!folder && <FolderIcon name={child.name} />}
        {categoryLink(child, styles.mobileCategoryLink)}
      </div>)}
    </div>

    {folder && children.length === 0 && <div className={styles.directoryEmpty}>
      <p>В этом разделе нет подкатегорий.</p>
      <button type="button" onClick={() => props.onSelect(folder)}>Перейти к товарам</button>
    </div>}
  </section>;
}
