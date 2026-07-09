import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { FileText } from "lucide-react-native";
import { COLORS } from "@/constants";
import { FONTS, RADII, SHADOW } from "@/constants/theme";
import { timeAgo, truncate } from "@/lib/format";
import type { DashboardUpdate } from "@/types";

interface UpdateCardProps {
  update: DashboardUpdate;
}

export function UpdateCard({ update }: UpdateCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.80}
      onPress={() => router.push(`/(client)/projects/${update.project.id}` as never)}
    >
      {update.imageUrl ? (
        <Image source={{ uri: update.imageUrl }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <FileText size={18} color={COLORS.zinc400} />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.projectName} numberOfLines={1}>
          {update.project.title}
        </Text>
        <Text style={styles.note} numberOfLines={2}>
          {truncate(update.note, 90)}
        </Text>
        <View style={styles.footer}>
          {update.progressPercent !== null && (
            <View style={styles.progressChip}>
              <Text style={styles.progressText}>{update.progressPercent}%</Text>
            </View>
          )}
          <Text style={styles.time}>{timeAgo(update.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function UpdateCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.thumb, { backgroundColor: COLORS.zinc100 }]} />
      <View style={styles.body}>
        <View style={[styles.skeleton, { width: 100, height: 11, marginBottom: 6 }]} />
        <View style={[styles.skeleton, { width: "90%", height: 10, marginBottom: 4 }]} />
        <View style={[styles.skeleton, { width: "60%", height: 10 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    RADII.md,
    flexDirection:   "row",
    overflow:        "hidden",
    marginBottom:    10,
    borderWidth:     1,
    borderColor:     COLORS.zinc200,
    ...SHADOW.card,
  },
  thumb: {
    width:  72,
    height: 90,
  },
  thumbPlaceholder: {
    backgroundColor: COLORS.zinc100,
    alignItems:      "center",
    justifyContent:  "center",
  },
  body: {
    flex:    1,
    padding: 12,
    justifyContent: "space-between",
  },
  projectName: {
    fontSize:      11,
    fontFamily:    FONTS.bold,
    color:         COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom:  2,
  },
  note: {
    fontSize:   13,
    fontFamily: FONTS.regular,
    color:      COLORS.zinc700,
    lineHeight: 18,
    flex:       1,
  },
  footer: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           8,
    marginTop:     6,
  },
  progressChip: {
    backgroundColor:  COLORS.primary + "15",
    borderRadius:     10,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  progressText: {
    fontSize:   10,
    fontFamily: FONTS.bold,
    color:      COLORS.primary,
  },
  time: {
    fontSize:   10,
    fontFamily: FONTS.regular,
    color:      COLORS.zinc400,
    flex:       1,
    textAlign:  "right",
  },
  skeleton: {
    backgroundColor: COLORS.zinc100,
    borderRadius:    5,
  },
});
