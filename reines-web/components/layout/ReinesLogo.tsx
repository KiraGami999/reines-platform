import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const REINES_ICON_SRC = "/logo-loader.png";

const ICON_BOX_CLASS = {
  xs: "h-8 w-8 rounded-md p-1",
  sm: "h-8 w-8 rounded-md p-1",
  md: "h-11 w-11 rounded-lg p-1.5",
  lg: "h-12 w-12 rounded-lg p-1.5",
  xl: "h-28 w-28 rounded-2xl p-3 sm:h-36 sm:w-36 sm:p-4",
} as const;

const TEXT_CLASS = {
  sm: {
    primary: "text-sm font-bold tracking-tight",
    secondary: "text-[9px] font-normal uppercase tracking-widest",
  },
  md: {
    primary: "text-lg font-bold tracking-tight sm:text-xl",
    secondary: "text-[10px] font-normal uppercase tracking-[0.16em] sm:text-[11px]",
  },
  lg: {
    primary: "text-xl font-bold tracking-tight",
    secondary: "text-[11px] font-normal uppercase tracking-[0.16em]",
  },
} as const;

type ReinesLogoProps = {
  /** `on-dark` = white text for navy backgrounds. `on-light` = navy text for pale backgrounds. */
  variant?: "on-dark" | "on-light";
  size?: keyof typeof ICON_BOX_CLASS;
  /** Show only the icon mark (sidebar collapsed, mobile header). */
  iconOnly?: boolean;
  linked?: boolean;
  className?: string;
  priority?: boolean;
};

export function ReinesLogo({
  variant = "on-dark",
  size = "md",
  iconOnly = false,
  linked = false,
  className,
  priority = false,
}: ReinesLogoProps) {
  const textSize = size === "xs" || size === "sm" ? "sm" : size === "lg" || size === "xl" ? "lg" : "md";
  const textStyles = TEXT_CLASS[textSize];

  const mark = (
    <span className={cn("inline-flex min-w-0 shrink-0 items-center", iconOnly ? "" : "gap-3", className)}>
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center backdrop-blur-sm",
          ICON_BOX_CLASS[size],
          variant === "on-dark" ? "bg-white/10" : "bg-[#2d4a6b]/10"
        )}
      >
        <Image
          src={REINES_ICON_SRC}
          alt=""
          width={size === "xl" ? 144 : size === "md" || size === "lg" ? 44 : 32}
          height={size === "xl" ? 144 : size === "md" || size === "lg" ? 44 : 32}
          priority={priority}
          aria-hidden
          className="h-full w-full object-contain mix-blend-screen"
        />
      </span>

      {!iconOnly && size !== "xl" && (
        <span className="min-w-0 leading-tight">
          <span
            className={cn(
              "block truncate",
              textStyles.primary,
              variant === "on-dark" ? "text-white" : "text-[#2d4a6b]"
            )}
          >
            Reines Property
          </span>
          <span
            className={cn(
              "block truncate",
              textStyles.secondary,
              variant === "on-dark" ? "text-zinc-300" : "text-zinc-500"
            )}
          >
            Development Limited
          </span>
        </span>
      )}
    </span>
  );

  if (!linked) {
    return (
      <span role="img" aria-label="Reines Property Development Limited">
        {mark}
      </span>
    );
  }

  return (
    <Link
      href="/"
      className="group inline-flex min-w-0 shrink-0 items-center transition-transform duration-300 hover:scale-[1.02]"
      aria-label="Reines Property Development Limited — Home"
    >
      {mark}
    </Link>
  );
}
