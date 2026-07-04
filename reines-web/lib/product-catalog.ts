import { prisma } from "@/lib/prisma";
import {
  normalizeProductSubsidiary,
  type ProductCatalogItem,
} from "@/lib/product-catalog-data";

export {
  AVAILABLE_PRODUCT_IMAGES,
  FALLBACK_PRODUCTS,
  PRODUCT_SUBSIDIARIES,
  PRODUCT_SUBSIDIARY_OPTIONS,
  getSubsidiaryMeta,
  normalizeProductSubsidiary,
  type AvailableProductImage,
  type ProductCatalogItem,
  type ProductSubsidiary,
  type ProductSubsidiaryFilter,
} from "@/lib/product-catalog-data";

export { getProductImageLibrary } from "@/lib/product-image-library";

function serializeProduct(product: {
  id: string;
  name: string;
  subsidiary: string;
  description: string;
  sizes: string[];
  applications: string[];
  imageUrl: string;
  badge: string | null;
  priceLabel: string | null;
  promoLabel: string | null;
  active: boolean;
  sortOrder: number;
}): ProductCatalogItem {
  return {
    id: product.id,
    name: product.name,
    subsidiary: normalizeProductSubsidiary(product.subsidiary),
    description: product.description,
    sizes: product.sizes,
    applications: product.applications,
    imageUrl: product.imageUrl,
    badge: product.badge ?? "Available",
    priceLabel: product.priceLabel ?? "Request quote",
    promoLabel: product.promoLabel ?? "",
    active: product.active,
    sortOrder: product.sortOrder,
  };
}

/** Public catalogue — only saved, active products from the database. */
export async function getProductCatalog(): Promise<ProductCatalogItem[]> {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return products.map(serializeProduct);
  } catch (error) {
    console.error("[getProductCatalog]", error);
    return [];
  }
}

/** Admin catalogue — all saved products from the database (including hidden). */
export async function getAdminProductCatalog(): Promise<{ products: ProductCatalogItem[] }> {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return { products: products.map(serializeProduct) };
  } catch (error) {
    console.error("[getAdminProductCatalog]", error);
    return { products: [] };
  }
}
