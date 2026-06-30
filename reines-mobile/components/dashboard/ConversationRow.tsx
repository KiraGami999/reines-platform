import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import { COLORS } from "@/constants";
import { timeAgo, truncate } from "@/lib/format";
import type { DashboardConversation } from "@/types";

interface ConversationRowProps {
  conversation: DashboardConversation;
  currentUserId: string;
}

export function ConversationRow({ conversation, currentUserId }: ConversationRowProps) {
  const router      = useRouter();
  const msg         = conversation.lastMessage;
  const isMine      = msg.sender.id === currentUserId;
  const initials    = conversation.manager.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.80}
      onPress={() => router.push(`/(client)/messages/${conversation.projectId}` as never)}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{conversation.manager.name}</Text>
          <Text style={styles.time}>{timeAgo(msg.createdAt)}</Text>
        </View>
        <Text style={styles.project} numberOfLines={1}>{conversation.projectTitle}</Text>
        <Text style={styles.preview} numberOfLines={1}>
          {isMine ? "You: " : ""}{truncate(msg.message, 70)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function ConversationRowSkeleton() {
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: COLORS.zinc100 }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.skeleton, { width: 90, height: 12 }]} />
          <View style={[styles.skeleton, { width: 40, height: 10 }]} />
        </View>
        <View style={[styles.skeleton, { width: 120, height: 10, marginVertical: 4 }]} />
        <View style={[styles.skeleton, { width: "80%", height: 10 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:   "row",
    alignItems:      "center",
    paddingVertical: 10,
    gap:             12,
  },
  avatar: {
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: COLORS.primary,
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
  },
  avatarText: {
    fontSize:   14,
    fontWeight: "700",
    color:      COLORS.white,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   2,
  },
  name: {
    fontSize:   14,
    fontWeight: "700",
    color:      COLORS.zinc900,
    flex:       1,
    marginRight: 8,
  },
  time: {
    fontSize: 11,
    color:    COLORS.zinc400,
  },
  project: {
    fontSize:     11,
    color:        COLORS.primary,
    fontWeight:   "600",
    marginBottom: 2,
  },
  preview: {
    fontSize: 12,
    color:    COLORS.zinc500,
    lineHeight: 16,
  },
  skeleton: {
    backgroundColor: COLORS.zinc100,
    borderRadius:    5,
  },
});
