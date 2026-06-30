import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MessageSquare, BarChart2, Image as ImageIcon } from "lucide-react-native";
import { COLORS } from "@/constants";
import { timeAgo } from "@/lib/format";
import type { ManagerRecentMessage, ManagerActivityUpdate } from "@/types";

// ─── Message item ─────────────────────────────────────────────────────────────

interface MessageItemProps {
  item: ManagerRecentMessage;
}

export function MessageFeedItem({ item }: MessageItemProps) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.75}
      onPress={() => router.push(`/(manager)/messages/${item.projectId}` as never)}
    >
      <View style={[styles.iconWrap, { backgroundColor: COLORS.primary + "14" }]}>
        <MessageSquare size={16} color={COLORS.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.project} numberOfLines={1}>{item.projectTitle}</Text>
        <Text style={styles.detail} numberOfLines={2}>
          <Text style={styles.sender}>{item.sender.name}: </Text>
          {item.message}
        </Text>
      </View>
      <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
    </TouchableOpacity>
  );
}

// ─── Update / activity item ───────────────────────────────────────────────────

interface UpdateItemProps {
  item: ManagerActivityUpdate;
}

export function UpdateFeedItem({ item }: UpdateItemProps) {
  const router   = useRouter();
  const hasImage = !!item.imageUrl;

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.75}
      onPress={() => router.push(`/(manager)/projects/${item.projectId}` as never)}
    >
      <View style={[styles.iconWrap, { backgroundColor: COLORS.green + "14" }]}>
        {hasImage
          ? <ImageIcon size={16} color={COLORS.green} />
          : <BarChart2  size={16} color={COLORS.green} />}
      </View>
      <View style={styles.body}>
        <Text style={styles.project} numberOfLines={1}>{item.projectTitle}</Text>
        <Text style={styles.detail} numberOfLines={2}>{item.note}</Text>
        {item.progressPercent !== null && (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${item.progressPercent}%` as `${number}%` }]} />
            </View>
            <Text style={styles.progressText}>{item.progressPercent}%</Text>
          </View>
        )}
      </View>
      <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
    </TouchableOpacity>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function FeedItemSkeleton() {
  return (
    <View style={styles.row}>
      <View style={[styles.sk, { width: 36, height: 36, borderRadius: 18 }]} />
      <View style={styles.body}>
        <View style={[styles.sk, { width: 100, height: 12, marginBottom: 5 }]} />
        <View style={[styles.sk, { width: "90%", height: 10 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems:    "flex-start",
    gap:           10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  iconWrap: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
    marginTop:      2,
  },
  body:   { flex: 1, gap: 3 },
  project:{ fontSize: 11, fontWeight: "700", color: COLORS.zinc400, textTransform: "uppercase", letterSpacing: 0.3 },
  detail: { fontSize: 13, color: COLORS.zinc700, lineHeight: 18 },
  sender: { fontWeight: "700", color: COLORS.zinc800 },
  time:   { fontSize: 10, color: COLORS.zinc400, flexShrink: 0, marginTop: 4 },

  progressRow:  { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  progressTrack:{ flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.zinc100, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2, backgroundColor: COLORS.green },
  progressText: { fontSize: 10, color: COLORS.green, fontWeight: "700", width: 28 },

  sk: { backgroundColor: COLORS.zinc100, borderRadius: 5 },
  zinc700: { color: COLORS.zinc700 },
  zinc800: { color: COLORS.zinc800 },
});
