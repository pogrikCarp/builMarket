// МойСклад отдаёт разделы и подкатегории одним плоским списком (entity/productfolder).
// Строим из него дерево «раздел → подкатегории» по ссылке productFolder.meta.href,
// иначе подкатегории отображаются как самостоятельные разделы вперемешку с основными.

export type FolderLike = {
  id: string;
  name: string;
  meta: { href: string };
  productFolder?: { meta: { href: string } } | null;
};

export function buildFolderTree<T extends FolderLike>(folders: T[]) {
  const hrefSet = new Set(folders.map((folder) => folder.meta.href));
  const childrenByParent = new Map<string, T[]>();
  const roots: T[] = [];

  folders.forEach((folder) => {
    const parentHref = folder.productFolder?.meta.href;
    if (parentHref && hrefSet.has(parentHref)) {
      if (!childrenByParent.has(parentHref)) childrenByParent.set(parentHref, []);
      childrenByParent.get(parentHref)!.push(folder);
    } else {
      roots.push(folder);
    }
  });

  return { roots, childrenByParent };
}

export function getRootOfFolder<T extends FolderLike>(
  folder: T,
  roots: T[],
  childrenByParent: Map<string, T[]>
): T | null {
  if (roots.some((root) => root.id === folder.id)) return folder;
  for (const root of roots) {
    const children = childrenByParent.get(root.meta.href) ?? [];
    if (children.some((child) => child.id === folder.id)) return root;
  }
  return null;
}
