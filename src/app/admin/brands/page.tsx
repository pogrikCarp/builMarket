import { getManagedBrands } from "@/lib/brand-profiles";
import { getCatalogItemsByIds } from "@/lib/catalog-db";
import BrandsManager from "./BrandsManager";

export default async function AdminBrandsPage() {
  const brands = await getManagedBrands();
  const products = await getCatalogItemsByIds(brands.flatMap(brand => brand.productIds));
  return <BrandsManager initialBrands={brands} initialProducts={[...products.values()].map(item => ({ id: item.id, name: item.name, code: item.code, article: item.article }))} />;
}
