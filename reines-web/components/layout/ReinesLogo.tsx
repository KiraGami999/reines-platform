import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const REINES_LOGO_SRC = "/reines-logo.png";

const SIZE_CLASS = {
  xs: "h-6 w-auto max-w-[120px] sm:max-w-[140px]",
  sm: "h-7 w-auto max-w-[140px] sm:max-w-[160px]",
  md: "h-9 w-auto max-w-[180px] sm:max-w-[200px]",
  lg: "h-11 w-auto max-w-[220px] sm:max-w-[240px]",
  xl: "h-14 w-auto max-w-[280px] sm:max-w-[320px]",
} as const;

type ReinesLogoProps = {
  /** `on-dark` = white logo for navy/dark backgrounds. `on-light` = dark logo for pale backgrounds. */
  variant?: "on-dark" | "on-light";
  size?: keyof typeof SIZE_CLASS;
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
      width={320}
      height={72}
      priority={priority}
      className={cn(
        SIZE_CLASS[size],
        "object-contain object-left",
        variant === "on-light" && "brightness-0",
        className
      )}
    />
  );

  if (!linked) return image;

  return (
    <Link href="/" className="inline-flex min-w-0 shrink-0 items-center">
      {image}
    </Link>
  );
}
