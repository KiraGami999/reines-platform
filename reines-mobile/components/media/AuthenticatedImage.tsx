import React from "react";
import { View, StyleSheet, type StyleProp, type ImageStyle, type ViewStyle } from "react-native";
import { Image, type ImageContentFit } from "expo-image";
import { useAuth } from "@/hooks/useAuth";
import { buildImageSource } from "@/lib/media";
import { COLORS } from "@/constants";

interface AuthenticatedImageProps {
  url:         string | null | undefined;
  style?:      StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  /** RN Image-compatible alias used by some call sites */
  resizeMode?: "cover" | "contain" | "stretch" | "center";
  recyclingKey?: string;
  transition?: number;
  placeholderColor?: string;
}

/**
 * Renders private gallery / receipt images.
 *
 * Private Vercel Blob files are served via /api/media. Android / Expo Go
 * image loaders don't send Authorization headers reliably, so we stamp the
 * JWT onto the URL as `?token=` — the same approach documents already use.
 */
export function AuthenticatedImage({
  url,
  style,
  contentFit,
  resizeMode,
  recyclingKey,
  transition = 200,
  placeholderColor = COLORS.zinc200,
}: AuthenticatedImageProps) {
  const { token } = useAuth();

  const fit: ImageContentFit =
    contentFit ??
    (resizeMode === "contain"
      ? "contain"
      : resizeMode === "stretch"
        ? "fill"
        : resizeMode === "center"
          ? "none"
          : "cover");

  const source = buildImageSource(url, token);

  if (!source) {
    return (
      <View
        style={[
          styles.fallback,
          style as StyleProp<ViewStyle>,
          { backgroundColor: placeholderColor },
        ]}
      />
    );
  }

  return (
    <Image
      source={source}
      style={style}
      contentFit={fit}
      transition={transition}
      recyclingKey={recyclingKey}
      cachePolicy="none"
      placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
      placeholderContentFit="cover"
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    width:  "100%",
    height: "100%",
  },
});
