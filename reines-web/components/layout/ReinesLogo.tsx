import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const REINES_LOGO_SRC = "/logo.png";

/** Logo aspect ratio from trimmed transparent asset (684×143). */
const LOGO_WIDTH = 684;
const LOGO_HEIGHT = 143;

const HEIGHT_CLASS = {
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

type ReinesLogoProps = {
  /** `on-dark` = white logo on navy backgrounds. `on-light` = dark logo on pale backgrounds. */
  variant?: "on-dark" | "on-light";
  size?: keyof typeof HEIGHT_CLASS;
  linked?: boolean;
  className?: string;
  priority?: boolean;
};

export function ReinesLogo({
  variant = "on-dark",
  size = "md",
  linked = false,
  className,
  priority = false,
}: ReinesLogoProps) {
  const image = (
    <Image
      src={REINES_LOGO_SRC}
      alt="Reines Property Development Limited"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      className={cn(
        HEIGHT_CLASS[size],
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
      aria-label="Reines Property Development Limited — Home"
    >
      {image}
    </Link>
  );
}
