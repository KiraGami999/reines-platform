import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  getProductImageLibrary,
  getProductsUsingImage,
  hideProductLibraryImage,
} from "@/lib/product-image-library";
import {
  badRequest,
  conflict,
  forbidden,
  ok,
  serverError,
  validationError,
} from "@/lib/api-response";
import {
  deleteProductLibraryImageFile,
  isManagedProductLibraryImageUrl,
  StorageError,
} from "@/lib/storage";

const deleteSchema = z.object({
  imageUrl: z.string().trim().min(1),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return forbidden();

  try {
    const images = await getProductImageLibrary();
    return ok({ images });
  } catch (error) {
    console.error("[ADMIN_PRODUCT_IMAGES_GET]", error);
    return serverError("Could not load product image library.");
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { imageUrl } = parsed.data;

  if (!isManagedProductLibraryImageUrl(imageUrl)) {
    return badRequest("Only product catalogue images can be removed from the library.");
  }

  try {
    const inUseBy = await getProductsUsingImage(imageUrl);
    if (inUseBy.length > 0) {
      return conflict(
        `This image is used by: ${inUseBy.join(", ")}. Change those products first, then delete the image.`
      );
    }

    if (imageUrl.startsWith("/uploads/product-images/") || imageUrl.startsWith("/product-images/")) {
      await deleteProductLibraryImageFile(imageUrl);
    }

    await hideProductLibraryImage(imageUrl);

    const images = await getProductImageLibrary();
    revalidatePath("/dashboard/admin/products");

    return ok({ images, removed: imageUrl });
  } catch (err) {
    if (err instanceof StorageError) {
      return badRequest(err.message);
    }
    console.error("[ADMIN_PRODUCT_IMAGES_DELETE]", err);
    return serverError("Could not remove image from the library.");
  }
}
