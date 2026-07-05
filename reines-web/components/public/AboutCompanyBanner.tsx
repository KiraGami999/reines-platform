import Image from "next/image";

/**
 * Full-width company showcase band (16:2 aspect ratio).
 * Sits between the story hero and Mission / Vision on the About page.
 */
export function AboutCompanyBanner() {
  return (
    <section
      aria-label="Reines company brands"
      className="relative w-full border-y border-[#2d4a6b]/10 bg-gradient-to-r from-[#243040] via-[#2d4a6b] to-[#243040]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(143,185,232,0.08)_0%,transparent_35%,transparent_65%,rgba(143,185,232,0.08)_100%)]" />

      <div className="relative mx-auto aspect-[16/2] w-full max-w-[100vw]">
        <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-8 lg:px-12">
          <div className="relative h-[72%] w-full max-w-5xl sm:h-[78%] sm:max-w-6xl">
            <Image
              src="/about/reines-procrete-banner.png"
              alt="Reines ProCrete — a trademark of Reines Property Development"
              fill
              priority={false}
              sizes="(max-width: 1280px) 100vw, 1152px"
              className="object-contain object-center drop-shadow-sm"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
