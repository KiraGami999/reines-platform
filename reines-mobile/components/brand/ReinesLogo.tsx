import { Image, type ImageStyle, type StyleProp } from "react-native";
import { APP_NAME } from "@/constants";

/** Trimmed wordmark aspect ratio from source asset (684×143). */
export const LOGO_WORDMARK_ASPECT = 684 / 143;

/** Project Mate wordmark aspect ratio (707×162). */
export const PROJECT_MATE_WORDMARK_ASPECT = 707 / 162;

/** Corporate rebrand wordmark aspect ratio (795×163). */
export const CORPORATE_WORDMARK_ASPECT = 795 / 163;

/** Icon-only crop aspect ratio (154×154). */
export const LOGO_ICON_ASPECT = 1;

const CORPORATE_WORDMARK = {
  "on-dark":  require("@/assets/logo-white.png"),
  "on-light": require("@/assets/logo-dark.png"),
} as const;

const PROJECT_MATE_WORDMARK = {
  "on-dark":  require("@/assets/logo-project-mate-white.png"),
  "on-light": require("@/assets/logo-project-mate-navy.png"),
} as const;

const ICON = {
  "on-dark":  require("@/assets/logo-icon-white.png"),
  "on-light": require("@/assets/logo-icon-dark.png"),
} as const;

export type PortalLogoMark = "corporate" | "project-mate";

type ReinesLogoProps = {
  /** White wordmark on navy backgrounds; navy wordmark on light backgrounds. */
  variant?: "on-dark" | "on-light";
  /** Full wordmark or hexagon icon only. */
  mode?: "wordmark" | "icon";
  /**
   * `corporate` = Reines Property Development (admin).
   * `project-mate` = Reines Project Mate (client + project manager).
   */
  mark?: PortalLogoMark;
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function ReinesLogo({
  variant = "on-dark",
  mode = "wordmark",
  mark = "project-mate",
  height = 36,
  style,
}: ReinesLogoProps) {
  const source =
    mode === "icon"
      ? ICON[variant]
      : mark === "project-mate"
        ? PROJECT_MATE_WORDMARK[variant]
        : CORPORATE_WORDMARK[variant];

  const aspect =
    mode === "icon"
      ? LOGO_ICON_ASPECT
      : mark === "project-mate"
        ? PROJECT_MATE_WORDMARK_ASPECT
        : CORPORATE_WORDMARK_ASPECT;

  const label = mark === "project-mate" ? APP_NAME : "Reines Property Development";

  return (
    <Image
      source={source}
      accessibilityLabel={label}
      style={[{ height, width: height * aspect }, style]}
      resizeMode="contain"
    />
  );
}
