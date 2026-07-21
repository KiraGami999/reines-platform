import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const REINES_LOGO_SRC = "/logo.png";
export const PROJECT_MATE_LOGO_SRC = "/logo-project-mate.png";

/** Logo aspect ratio from trimmed transparent asset (684×143). */
const LOGO_WIDTH = 684;
const LOGO_HEIGHT = 143;

/** Project Mate wordmark aspect ratio from trimmed transparent asset (738×134) — wider than the corporate mark. */
const PROJECT_MATE_WIDTH = 738;
const PROJECT_MATE_HEIGHT = 134;

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
 * Its aspect ratio is ~15% wider than the corporate mark, so heights are scaled
 * down proportionally to land at the same rendered width — keeps it fitting
 * cleanly inside the sidebar logo row and mobile header without crowding the
 * collapse / hamburger buttons next to it.
 */
const PROJECT_MATE_SIZE_CLASS = {
  xs: "h-6",
  sm: "h-7",
  md: "h-9 sm:h-10",
  lg: "h-10 sm:h-12",
  nav: "h-8 min-h-8 sm:h-9 lg:h-10",
  sidebar: "h-7 max-w-[9.5rem] sm:h-8 sm:max-w-[11rem]",
  header: "h-5 max-w-[7rem] sm:h-6 sm:max-w-[8.5rem]",
  xl: "h-20 sm:h-24 md:h-28",
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
