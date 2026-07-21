import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const REINES_LOGO_SRC = "/logo.png";
export const PROJECT_MATE_LOGO_SRC = "/logo-project-mate.png";

/** Logo aspect ratio from trimmed transparent asset (684×143). */
const LOGO_WIDTH = 684;
const LOGO_HEIGHT = 143;

/** Project Mate wordmark aspect ratio from trimmed transparent asset (707×162). */
const PROJECT_MATE_WIDTH = 707;
const PROJECT_MATE_HEIGHT = 162;

/** Sizing for the corporate (Reines Property Development) wordmark. */
const CORPORATE_SIZE_CLASS = {
  xs: "h-7",
  sm: "h-8",
  md: "h-10 sm:h-11",
  lg: "h-12 sm:h-14",
  /** Public site navbar (h-20) — kept under the bar height for clear padding. */
  nav: "h-9 min-h-9 sm:h-10 lg:h-11",
  /**
   * Portal sidebar logo row (h-16). Sized so the wordmark has clear vertical
   * padding — previously md filled the bar and looked cramped.
   */
  sidebar: "h-8 max-w-[9.5rem] sm:h-9 sm:max-w-[11rem]",
  /**
   * Compact portal header mark (mobile top-left).
   * Caps width so the wide wordmark doesn’t crowd the hamburger + title.
   */
  header: "h-6 max-w-[6.5rem] sm:h-7 sm:max-w-[8rem]",
  xl: "h-24 sm:h-28 md:h-32",
} as const;

/**
 * Sizing for the Reines Project Mate wordmark (client / project manager portals).
 * Its aspect ratio (707×162) is close to the corporate mark's (684×143), so it
 * reuses the same height classes — just with slightly roomier max-width caps
 * since it's a touch narrower per unit height.
 */
const PROJECT_MATE_SIZE_CLASS = {
  xs: "h-7",
  sm: "h-8",
  md: "h-10 sm:h-11",
  lg: "h-12 sm:h-14",
  nav: "h-9 min-h-9 sm:h-10 lg:h-11",
  sidebar: "h-8 max-w-[9.5rem] sm:h-9 sm:max-w-[11rem]",
  header: "h-6 max-w-[6.5rem] sm:h-7 sm:max-w-[8rem]",
  xl: "h-24 sm:h-28 md:h-32",
} as const;

type ReinesLogoProps = {
  /** `on-dark` = white logo on navy backgrounds. `on-light` = dark logo on pale backgrounds. */
  variant?: "on-dark" | "on-light";
  size?: keyof typeof CORPORATE_SIZE_CLASS;
  linked?: boolean;
  className?: string;
  priority?: boolean;
  /**
   * `corporate` = Reines Property Development wordmark (default, admin portal + public site).
   * `project-mate` = Reines Project Mate wordmark (client + project manager portals).
   */
  mark?: "corporate" | "project-mate";
};

const MARK_CONFIG = {
  corporate: {
    src: REINES_LOGO_SRC,
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    alt: "Reines Property Development Limited",
    sizeClass: CORPORATE_SIZE_CLASS,
  },
  "project-mate": {
    src: PROJECT_MATE_LOGO_SRC,
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

  const image = (
    <Image
      src={config.src}
      alt={config.alt}
      width={config.width}
      height={config.height}
      priority={priority}
      className={cn(
        config.sizeClass[size],
        "w-auto max-w-none object-contain object-left",
        variant === "on-light" && "brightness-0",
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
