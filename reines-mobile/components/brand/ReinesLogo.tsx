import { Image, type ImageStyle, type StyleProp } from "react-native";
import { APP_NAME } from "@/constants";

/** Trimmed wordmark aspect ratio from source asset (687×136). */
export const LOGO_WORDMARK_ASPECT = 687 / 136;

/** Icon-only crop aspect ratio (142×136). */
export const LOGO_ICON_ASPECT = 142 / 136;

const WORDMARK = {
  "on-dark":  require("@/assets/logo-white.png"),
  "on-light": require("@/assets/logo-dark.png"),
} as const;

const ICON = {
  "on-dark":  require("@/assets/logo-icon-white.png"),
  "on-light": require("@/assets/logo-icon-dark.png"),
} as const;

type ReinesLogoProps = {
  /** White wordmark on navy backgrounds; navy wordmark on light backgrounds. */
  variant?: "on-dark" | "on-light";
  /** Full wordmark or hexagon icon only. */
  mode?: "wordmark" | "icon";
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function ReinesLogo({
  variant = "on-dark",
  mode = "wordmark",
  height = 36,
  style,
}: ReinesLogoProps) {
  const source = mode === "icon" ? ICON[variant] : WORDMARK[variant];
  const aspect = mode === "icon" ? LOGO_ICON_ASPECT : LOGO_WORDMARK_ASPECT;

  return (
    <Image
      source={source}
      accessibilityLabel={APP_NAME}
      style={[{ height, width: height * aspect }, style]}
      resizeMode="contain"
    />
  );
}
