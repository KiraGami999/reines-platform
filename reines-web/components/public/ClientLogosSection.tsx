import Image from "next/image";
import type { ClientLogoItem } from "@/lib/client-logos-data";

type Props = {
  logos: ClientLogoItem[];
};

/** Below this many tiles per pass, the loop would visibly repeat too fast — pad it out. */
const MIN_TRACK_LOGOS = 10;
/** Constant scroll speed (px/s) so the marquee feels the same pace no matter how many logos exist. */
const PX_PER_SECOND = 55;
/** Matches the tile width + gap below (w-44 sm:w-56 + gap-10), used only to size the animation duration. */
const APPROX_TILE_WIDTH = 240;

function LogoMark({ logo, ariaHidden = false }: { logo: ClientLogoItem; ariaHidden?: boolean }) {
  const darkSrc = logo.darkLogoUrl || logo.lightLogoUrl;

  const content = (
    <div className="relative h-16 w-full sm:h-20">
      {/* Light-mode variant */}
      <Image
        src={logo.lightLogoUrl}
        alt={logo.name}
        fill
        unoptimized={logo.lightLogoUrl.startsWith("/api/media")}
        sizes="240px"
        className="object-contain dark:hidden"
      />
      {/* Dark-mode variant — falls back to the light logo if none was uploaded */}
      <Image
        src={darkSrc}
        alt={logo.name}
        fill
        unoptimized={darkSrc.startsWith("/api/media")}
        sizes="240px"
        className="hidden object-contain dark:block"
      />
    </div>
  );

  if (logo.websiteUrl) {
    return (
      <a
        href={logo.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center px-4 py-2 transition-opacity hover:opacity-80"
        aria-label={logo.name}
        aria-hidden={ariaHidden}
        tabIndex={ariaHidden ? -1 : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex items-center justify-center px-4 py-2" aria-label={logo.name} aria-hidden={ariaHidden}>
      {content}
    </div>
  );
}

/**
 * Renders just the "Trusted By" heading + logo marquee — no outer <section>
 * or width container of its own, so callers can embed it inside a larger
 * section (e.g. combined with the stats strip on the homepage) and control
 * the surrounding chrome themselves.
 */
export function ClientLogosSection({ logos }: Props) {
  if (logos.length === 0) return null;

  // Repeat the logo set so a single pass never looks sparse, then render two
  // identical passes back to back. Animating the wrapper by exactly -50% moves
  // it one full pass to the left, so the loop point is invisible.
  const repeatCount = Math.max(1, Math.ceil(MIN_TRACK_LOGOS / logos.length));
  const passLogos = Array.from({ length: repeatCount }, (_, i) =>
    logos.map((logo) => ({ logo, key: `${logo.id}-${i}` }))
  ).flat();

  const passWidth = passLogos.length * APPROX_TILE_WIDTH;
  const durationSeconds = Math.max(16, Math.round(passWidth / PX_PER_SECOND));

  return (
    <div>
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Trusted By</span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#2d4a6b] sm:text-3xl">
          Clients We&apos;ve Worked With
        </h2>
      </div>

      <div
        className="reines-logos-marquee relative mt-10 overflow-hidden [-webkit-mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      >
        <div
          className="reines-logos-track flex w-max items-center gap-10"
          style={{ animationDuration: `${durationSeconds}s` }}
        >
          {[0, 1].map((pass) => (
            <div key={pass} className="flex shrink-0 items-center gap-10" aria-hidden={pass === 1}>
              {passLogos.map(({ logo, key }) => (
                <div key={`${pass}-${key}`} className="w-44 shrink-0 sm:w-56">
                  <LogoMark logo={logo} ariaHidden={pass === 1} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
