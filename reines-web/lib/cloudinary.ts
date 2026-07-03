import { v2 as cloudinary } from "cloudinary";

/**
 * Configure the Cloudinary SDK from environment variables.
 * Called once at module load — safe to call multiple times (idempotent).
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

export { cloudinary };

/** Returns true when all three Cloudinary env vars are present and non-empty. */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY    &&
    process.env.CLOUDINARY_API_SECRET
  );
}
