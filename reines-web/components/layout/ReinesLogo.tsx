import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PortalLogoMark } from "@/lib/portal-branding";

/** White-on-transparent corporate wordmark (legacy). Kept for reference/fallbacks. */
export const REINES_LOGO_LEGACY_SRC = "/logo.png";
/** Current Reines Property Development rebrand — admin portal + public footer. */
export const REINES_LOGO_SRC = "/logo-nav-rebrand.png";
export const PROJECT_MATE_LOGO_SRC = "/logo-project-mate.png";
/** Pre-rendered navy foreground — Project Mate on light/pale backgrounds. */
export const PROJECT_MATE_LOGO_NAVY_SRC = "/logo-project-mate-navy.png";
/** Optional accent (#8fb9e8) — Project Mate on dark portal header. */
export const PROJECT_MATE_LOGO_ACCENT_SRC = "/logo-project-mate-accent.png";

/** Corporate rebrand aspect ratio from trimmed asset (795×163). */
const LOGO_WIDTH = 795;
const LOGO_HEIGHT = 163;

/** Project Mate wordmark aspect ratio from trimmed transparent asset (707×162). */
const PROJECT_MATE_WIDTH = 707;
const PROJECT_MATE_HEIGHT = 162;

/**
 * Every size entry must carry its own `max-w-*` (either an explicit cap or
 * `max-w-none`) — never leave it to a separate hardcoded class alongside
 * these. Tailwind resolves same-property utility clashes by internal
 * stylesheet order, not by position in `className`, so pairing e.g.
 * `max-w-[11rem]` here with a hardcoded `max-w-none` elsewhere is a real bug:
 * whichever rule happens to land later in the generated CSS silently wins,
 * which previously let the wordmark ignore its cap and overflow into
 * whatever sits next to it (collapse toggle, hamburger, header title).
 */

/** Sizing for the corporate (Reines Property Development) wordmark. */
const CORPORATE_SIZE_CLASS = {
  xs: "h-7 max-w-none",
  sm: "h-8 max-w-none",
  md: "h-10 max-w-none sm:h-11",
  lg: "h-12 max-w-none sm:h-14",
  /** Public site navbar (h-20) — kept under the bar height for clear padding. */
  nav: "h-9 min-h-9 max-w-none sm:h-10 lg:h-11",
  /**
   * Portal sidebar logo row (h-16). Sized so the wordmark has clear vertical
   * padding — previously md filled the bar and looked cramped. Capped so it
   * can never crowd the collapse-toggle button that shares this row.
   */
  sidebar: "h-8 max-w-[9.5rem] sm:h-9 sm:max-w-[11rem]",
  /**
   * Compact portal header mark (mobile top-left).
   * Caps width so the wide wordmark doesn’t crowd the hamburger + title.
   * Slight bump from h-6 / 6.5rem — still under the bar height.
   */
  header: "h-7 max-w-[7.5rem] sm:h-8 sm:max-w-[9rem]",
  xl: "h-24 max-w-none sm:h-28 md:h-32",
} as const;

/**
 * Sizing for the Reines Project Mate wordmark (client / project manager portals).
 * Its aspect ratio (707×162) is close to the corporate mark's (684×143), so it
 * reuses the same height classes — just with slightly roomier max-width caps
 * since it's a touch narrower per unit height.
 */
const PROJECT_MATE_SIZE_CLASS = {
  xs: "h-7 max-w-none",
  sm: "h-8 max-w-none",
  md: "h-10 max-w-none sm:h-11",
  lg: "h-12 max-w-none sm:h-14",
  nav: "h-9 min-h-9 max-w-none sm:h-10 lg:h-11",
  sidebar: "h-8 max-w-[9.5rem] sm:h-9 sm:max-w-[11rem]",
  /** Slightly roomier than the corporate mark's header size — requested bump. */
  header: "h-7 max-w-[7.5rem] sm:h-8 sm:max-w-[9rem]",
  xl: "h-24 max-w-none sm:h-28 md:h-32",
} as const;

type ReinesLogoProps = {
  /**
   * `on-dark` = white logo on navy/dark chrome (e.g. sidebar).
   * `on-dark-accent` = brand light-blue (#8fb9e8) on dark chrome (portal header).
   * `on-light` = darker grey/navy on pale backgrounds (light header).
   */
  variant?: "on-dark" | "on-dark-accent" | "on-light";
  size?: keyof typeof CORPORATE_SIZE_CLASS;
  linked?: boolean;
  className?: string;
  priority?: boolean;
  /**
   * `corporate` = Reines Property Development wordmark (default, admin portal + public site).
   * `project-mate` = Reines Project Mate wordmark (client + project manager portals).
   */
  mark?: PortalLogoMark;
};

/**
 * CSS filters applied to the white corporate wordmark when dedicated colour
 * assets are unavailable. Start from brightness(0) (black), then tint.
 * Accent ≈ #8fb9e8; light-header grey ≈ zinc-600 (#52525b).
 */
const CORPORATE_ACCENT_FILTER =
  "[filter:brightness(0)_invert(79%)_sepia(18%)_saturate(747%)_hue-rotate(176deg)_brightness(97%)_contrast(88%)]";
const CORPORATE_GREY_FILTER =
  "[filter:brightness(0)_invert(35%)_sepia(6%)_saturate(400%)_hue-rotate(182deg)_brightness(95%)_contrast(90%)]";

const MARK_CONFIG = {
  corporate: {
    src: REINES_LOGO_SRC,
    lightSrc: null as string | null,
    accentSrc: null as string | null,
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    alt: "Reines Property Development Limited",
    sizeClass: CORPORATE_SIZE_CLASS,
  },
  "project-mate": {
    /** White mark on dark navy chrome (sidebar). */
    src: PROJECT_MATE_LOGO_SRC,
    /** Navy on pale backgrounds (login, light header). */
    lightSrc: PROJECT_MATE_LOGO_NAVY_SRC as string | null,
    /** Light blue (#8fb9e8) on dark portal header. */
    accentSrc: PROJECT_MATE_LOGO_ACCENT_SRC as string | null,
    width: PROJECT_MATE_WIDTH,
    height: PROJECT_MATE_HEIGHT,
    alt: "Reines Project Mate",
    sizeClass: PROJECT_MATE_SIZE_CLASS,
  },
} as const;

export function ReinesLogo({
  variant = "on-dark",
  size = "md",
  linked = false,
  className,
  priority = false,
  mark = "corporate",
}: ReinesLogoProps) {
  const config = MARK_CONFIG[mark];
  const useNavyAsset = variant === "on-light" && config.lightSrc;
  const useAccentAsset = variant === "on-dark-accent" && config.accentSrc;
  const src = useAccentAsset
    ? config.accentSrc!
    : useNavyAsset
      ? config.lightSrc!
      : config.src;

  const image = (
    <Image
      src={src}
      alt={config.alt}
      width={config.width}
      height={config.height}
      priority={priority}
      className={cn(
        config.sizeClass[size],
        "w-auto object-contain object-left",
        // Corporate white PNG: tint to brand accent / darker grey when needed.
        mark === "corporate" && variant === "on-dark-accent" && CORPORATE_ACCENT_FILTER,
        mark === "corporate" && variant === "on-light" && CORPORATE_GREY_FILTER,
        // Project Mate fallback if navy asset missing.
        mark === "project-mate" && variant === "on-light" && !useNavyAsset && "brightness-0",
        className
      )}
    />
  );

  if (!linked) return image;

  return (
    <Link
      href="/"
      className="group inline-flex min-w-0 shrink-0 items-center transition-transform duration-300 hover:scale-[1.02]"
      aria-label={`${config.alt} — Home`}
    >
      {image}
    </Link>
  );
}
