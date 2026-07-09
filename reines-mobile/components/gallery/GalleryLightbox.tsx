import React, { useRef, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Download,
} from "lucide-react-native";
import { COLORS } from "@/constants";
import { fullDateTime, truncate } from "@/lib/format";
import type { GalleryImage } from "@/types";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface GalleryLightboxProps {
  items:       GalleryImage[];
  initialIndex: number;
  visible:     boolean;
  onClose:     () => void;
}

/**
 * GalleryLightbox
 *
 * Full-screen image viewer with:
 *   - Pinch-to-zoom via ScrollView's maximumZoomScale (native on iOS;
 *     single-tap fallback double-tap-to-zoom workaround on Android)
 *   - Prev / Next navigation
 *   - Update note + progress chip + timestamp in the footer
 *   - Blurred safe-area background so status-bar text remains readable
 */
export function GalleryLightbox({
  items,
  initialIndex,
  visible,
  onClose,
}: GalleryLightboxProps) {
  const [index, setIndex] = React.useState(initialIndex);
  const scrollRef         = useRef<ScrollView>(null);

  // Sync internal index when the caller changes initialIndex
  React.useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  const canPrev = index > 0;
  const canNext = index < items.length - 1;

  const prev = useCallback(() => {
    if (!canPrev) return;
    setIndex((i) => i - 1);
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, [canPrev]);

  const next = useCallback(() => {
    if (!canNext) return;
    setIndex((i) => i + 1);
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, [canNext]);

  const item = items[index];
  if (!visible || !item) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* ── Top bar ─────────────────────────────────────────────── */}
        <SafeAreaView style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
            <X size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.counter}>{index + 1} / {items.length}</Text>
          <View style={{ width: 40 }} />
        </SafeAreaView>

        {/* ── Zoomable image ──────────────────────────────────────── */}
        <ScrollView
          ref={scrollRef}
          style={styles.zoomScroll}
          contentContainerStyle={styles.zoomContent}
          maximumZoomScale={4}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bouncesZoom
          centerContent
          scrollEnabled
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.fullImage}
            contentFit="contain"
            transition={150}
            cachePolicy="memory-disk"
            recyclingKey={item.id}
          />
        </ScrollView>

        {/* ── Prev / Next arrows ──────────────────────────────────── */}
        <View style={styles.navRow} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.navBtn, !canPrev && styles.navBtnDisabled]}
            onPress={prev}
            activeOpacity={0.7}
            disabled={!canPrev}
          >
            <ChevronLeft size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[styles.navBtn, !canNext && styles.navBtnDisabled]}
            onPress={next}
            activeOpacity={0.7}
            disabled={!canNext}
          >
            <ChevronRight size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* ── Footer — note + meta ─────────────────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.footerMeta}>
            {item.progressPercent !== null && (
              <View style={styles.progressChip}>
                <TrendingUp size={11} color={COLORS.white} />
                <Text style={styles.progressText}>{item.progressPercent}% complete</Text>
              </View>
            )}
            <Text style={styles.dateText}>{fullDateTime(item.createdAt)}</Text>
          </View>
          {item.note ? (
            <Text style={styles.noteText} numberOfLines={3}>
              {item.note}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: "#000",
  },

  // Top bar
  topBar: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop:     Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 0,
    paddingBottom:  8,
  },
  closeBtn: {
    width:          40,
    height:         40,
    alignItems:     "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius:   20,
  },
  counter: {
    color:      COLORS.white,
    fontSize:   14,
    fontWeight: "600",
  },

  // Zoomable image
  zoomScroll: {
    flex: 1,
  },
  zoomContent: {
    flexGrow:       1,
    alignItems:     "center",
    justifyContent: "center",
  },
  fullImage: {
    width:  SCREEN_W,
    height: SCREEN_H * 0.62,
  },

  // Prev / next
  navRow: {
    ...StyleSheet.absoluteFillObject,
    top:            80,
    bottom:         160,
    flexDirection:  "row",
    alignItems:     "center",
    paddingHorizontal: 10,
  },
  navBtn: {
    width:          44,
    height:         44,
    alignItems:     "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius:   22,
  },
  navBtnDisabled: {
    opacity: 0.25,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop:        14,
    paddingBottom:     Platform.OS === "ios" ? 36 : 24,
    gap:               8,
  },
  footerMeta: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            10,
    flexWrap:       "wrap",
  },
  progressChip: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               4,
    backgroundColor:   COLORS.primary,
    borderRadius:      10,
    paddingHorizontal: 8,
    paddingVertical:   4,
  },
  progressText: {
    fontSize:   11,
    fontWeight: "700",
    color:      COLORS.white,
  },
  dateText: {
    fontSize: 12,
    color:    "rgba(255,255,255,0.55)",
  },
  noteText: {
    fontSize:   14,
    color:      "rgba(255,255,255,0.90)",
    lineHeight: 20,
  },
});
