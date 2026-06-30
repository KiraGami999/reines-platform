import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PRODUCT_SUBSIDIARY_OPTIONS,
  normalizeProductSubsidiary,
  type ProductCatalogItem,
} from "@/lib/product-catalog";
import { getProductImageLibrary } from "@/lib/product-image-library";
import { forbidden, ok, serverError, validationError } from "@/lib/api-response";
import { isAssignableProductImageUrl } from "@/lib/storage";

const subsidiaryValues = PRODUCT_SUBSIDIARY_OPTIONS.map((item) => item.value) as [
  ProductCatalogItem["subsidiary"],
  ...ProductCatalogItem["subsidiary"][],
];

function isValidProductImageUrl(value: string): boolean {
  return isAssignableProductImageUrl(value);
}

const productSchema = z.object({
  name: z.string().trim().min(3, "Product name must be at least 3 characters").max(90),
  subsidiary: z.enum(subsidiaryValues),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(500),
  sizes: z.array(z.string().trim().min(1).max(50)).min(1, "Add at least one size").max(8),
  applications: z.array(z.string().trim().min(1).max(70)).min(1, "Add at least one application").max(8),
  imageUrl: z.string().refine(isValidProductImageUrl, "Select or upload a valid product image"),
  badge: z.string().trim().max(40).optional().default("Available"),
  priceLabel: z.string().trim().max(50).optional().default("Request quote"),
  promoLabel: z.string().trim().max(60).optional().default(""),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(100),
});

const updateSchema = z.object({
  products: z.array(productSchema).max(30, "Keep the public catalogue focused"),
});
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

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
}) {
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

export async function GET() {
  const session = await requireAdmin();
  if (!session) return forbidden();

  try {
    const products = await prisma.product.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return ok({
      availableImages: await getProductImageLibrary(),
      products: products.map(serializeProduct),
    });
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_GET]", error);
    return ok({
      availableImages: [],
      products: [],
    });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const products = parsed.data.products.map((product, sortOrder) => ({
      name: product.name,
      subsidiary: product.subsidiary,
      description: product.description,
      sizes: product.sizes,
      applications: product.applications,
      imageUrl: product.imageUrl,
      badge: product.badge,
      priceLabel: product.priceLabel,
      promoLabel: product.promoLabel,
      active: product.active,
      sortOrder,
    }));

    await prisma.$transaction([
      prisma.product.deleteMany(),
      ...(products.length > 0 ? [prisma.product.createMany({ data: products })] : []),
    ]);

    const savedProducts = await prisma.product.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    revalidatePath("/products");
    revalidatePath("/dashboard/admin/products");

    return ok({ products: savedProducts.map(serializeProduct) });
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_PUT]", error);
    return serverError("Could not save products. Check the server logs and try again.");
  }
}
