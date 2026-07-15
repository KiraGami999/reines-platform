import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { TrendingUp } from "lucide-react-native";
import { COLORS } from "@/constants";
import { timeAgo } from "@/lib/format";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import type { GalleryImage } from "@/types";

const SCREEN_W  = Dimensions.get("window").width;
const GAP       = 3;
const COLUMNS   = 2;
const ITEM_SIZE = (SCREEN_W - GAP * (COLUMNS + 1)) / COLUMNS;

interface GalleryItemProps {
  item:    GalleryImage;
  onPress: (item: GalleryImage) => void;
}

/**
 * GalleryItem — fixed-size square thumbnail in the photo grid.
 *
 * Uses expo-image for:
 *   - Memory-efficient caching
 *   - Smooth fade-in via contentFit
 *   - Built-in placeholder via blurhash (falls back to a grey swatch)
 */
export function GalleryItem({ item, onPress }: GalleryItemProps) {
  return (
    <TouchableOpacity
      style={styles.cell}
      activeOpacity={0.88}
      onPress={() => onPress(item)}
    >
      <AuthenticatedImage
        url={item.imageUrl}
        style={styles.image}
        contentFit="cover"
        transition={200}
        recyclingKey={item.id}
      />

      {/* Dark gradient overlay for readability */}
      <View style={styles.overlay} pointerEvents="none">
        {item.progressPercent !== null && (
          <View style={styles.progressChip}>
            <TrendingUp size={10} color={COLORS.white} />
            <Text style={styles.progressText}>{item.progressPercent}%</Text>
          </View>
        )}
        <Text style={styles.timeLabel}>{timeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

/** Empty cell placeholder to fill the last row of an odd-count grid. */
export function GalleryItemPlaceholder() {
  return <View style={[styles.cell, { backgroundColor: "transparent" }]} />;
}

export { ITEM_SIZE, GAP, COLUMNS };

const styles = StyleSheet.create({
  cell: {
    width:        ITEM_SIZE,
    height:       ITEM_SIZE,
    overflow:     "hidden",
    borderRadius: 4,
  },
  image: {
    width:  "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    padding:        6,
    // Simulate gradient via a dark bottom strip
    borderBottomLeftRadius:  4,
    borderBottomRightRadius: 4,
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: -30 },
    shadowOpacity: 0.5,
    shadowRadius:  20,
  },
  progressChip: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               3,
    backgroundColor:   "rgba(0,0,0,0.45)",
    borderRadius:      8,
    paddingHorizontal: 5,
    paddingVertical:   2,
    alignSelf:         "flex-start",
    marginBottom:      3,
  },
  progressText: {
    fontSize:   9,
    fontWeight: "700",
    color:      COLORS.white,
  },
  timeLabel: {
    fontSize:   10,
    color:      "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
});
