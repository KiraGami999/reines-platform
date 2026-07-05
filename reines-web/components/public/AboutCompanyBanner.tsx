import Image from "next/image";

/** Set when a dedicated 16:2 banner asset is ready (recommended ~1920×240px). */
const BANNER_IMAGE_SRC: string | null = null;

/**
 * Full-width company showcase band (16:2 aspect ratio, pill / oval shape).
 * Sits between the story hero and Mission / Vision on the About page.
 */
export function AboutCompanyBanner() {
  return (
    <section
      aria-label="Reines company showcase"
      className="bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
    >
      <div
        className="relative mx-auto aspect-[16/2] w-full max-w-7xl overflow-hidden rounded-full border border-[#2d4a6b]/15 bg-gradient-to-r from-[#243040] via-[#2d4a6b] to-[#243040] shadow-[0_12px_40px_-12px_rgba(36,48,64,0.35)]"
      >
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(90deg,rgba(143,185,232,0.1)_0%,transparent_35%,transparent_65%,rgba(143,185,232,0.1)_100%)]" />

        {BANNER_IMAGE_SRC ? (
          <Image
            src={BANNER_IMAGE_SRC}
            alt="Reines Property Development"
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="rounded-full object-cover object-center"
          />
        ) : null}
      </div>
    </section>
  );
}
