import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { COLORS } from "@/constants";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size    = "sm" | "md" | "lg";

interface Props extends TouchableOpacityProps {
  children:  React.ReactNode;
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  fullWidth?: boolean;
  style?:    StyleProp<ViewStyle>;
}

const VARIANT_STYLES: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary:   { bg: COLORS.primary, text: COLORS.white },
  secondary: { bg: COLORS.accent,  text: COLORS.primary },
  danger:    { bg: COLORS.red,     text: COLORS.white },
  ghost:     { bg: "transparent",  text: COLORS.primary, border: COLORS.zinc200 },
};

const SIZE_STYLES: Record<Size, { py: number; px: number; fontSize: number }> = {
  sm: { py: 8,  px: 14, fontSize: 13 },
  md: { py: 12, px: 18, fontSize: 14 },
  lg: { py: 15, px: 22, fontSize: 15 },
};

export function Button({ children, variant = "primary", size = "md", loading, fullWidth, style, disabled, ...props }: Props) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <TouchableOpacity
      {...props}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderWidth:     v.border ? 1 : 0,
          borderColor:     v.border ?? "transparent",
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          width: fullWidth ? "100%" : undefined,
          opacity: (disabled || loading) ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator size="small" color={v.text} />
        : <Text style={[styles.label, { fontSize: s.fontSize, color: v.text }]}>{children}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:  { borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  label: { fontWeight: "700" },
});
