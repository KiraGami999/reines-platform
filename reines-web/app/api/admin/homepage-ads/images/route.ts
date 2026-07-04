import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  getHomepageImageLibrary,
  getHomepageAdsUsingImage,
  hideHomepageLibraryImage,
} from "@/lib/homepage-image-library";
import {
  badRequest,
  conflict,
  forbidden,
  ok,
  serverError,
  validationError,
} from "@/lib/api-response";
import {
  deleteHomepageAdLibraryImageFile,
  isManagedHomepageAdLibraryImageUrl,
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
    const images = await getHomepageImageLibrary();
    return ok({ images });
  } catch (error) {
    console.error("[ADMIN_HOMEPAGE_IMAGES_GET]", error);
    return serverError("Could not load homepage image library.");
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { imageUrl } = parsed.data;

  if (!isManagedHomepageAdLibraryImageUrl(imageUrl)) {
    return badRequest("Only homepage ad images can be removed from the library.");
  }

  try {
    const inUseBy = await getHomepageAdsUsingImage(imageUrl);
    if (inUseBy.length > 0) {
      return conflict(
        `This image is used by: ${inUseBy.join(", ")}. Deselect it from homepage ads first, then delete.`
      );
    }

    await deleteHomepageAdLibraryImageFile(imageUrl);

    await hideHomepageLibraryImage(imageUrl);

    const images = await getHomepageImageLibrary();
    revalidatePath("/");
    revalidatePath("/dashboard/admin/homepage");

    return ok({ images, removed: imageUrl });
  } catch (err) {
    if (err instanceof StorageError) {
      return badRequest(err.message);
    }
    console.error("[ADMIN_HOMEPAGE_IMAGES_DELETE]", err);
    return serverError("Could not remove image from the library.");
  }
}
