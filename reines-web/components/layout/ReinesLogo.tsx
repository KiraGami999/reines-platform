import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const REINES_LOGO_SRC = "/logo.png";

/** Logo aspect ratio from trimmed transparent asset (684×143). */
const LOGO_WIDTH = 684;
const LOGO_HEIGHT = 143;

const HEIGHT_CLASS = {
  xs: "h-8",
  sm: "h-10",
  md: "h-12 sm:h-14",
  lg: "h-14 sm:h-16",
  /** Fills the h-20 navbar while keeping the hexagon icon clearly readable. */
  nav: "h-12 min-h-12 sm:h-14 lg:h-16",
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
