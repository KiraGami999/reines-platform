import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const REINES_LOGO_SRC = "/logo.png";

/** Logo aspect ratio from extracted asset content (687×136). */
const LOGO_WIDTH = 687;
const LOGO_HEIGHT = 136;

const HEIGHT_CLASS = {
  xs: "h-6",
  sm: "h-7",
  md: "h-9 sm:h-10",
  lg: "h-11 sm:h-12",
  xl: "h-16 sm:h-20 md:h-24",
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
