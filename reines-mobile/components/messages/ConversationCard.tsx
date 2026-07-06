import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import { COLORS, PROJECT_STATUS_CONFIG } from "@/constants";
import { timeAgo, truncate } from "@/lib/format";
import type { Conversation } from "@/types";

interface ConversationCardProps {
  conversation:       Conversation;
  currentUserId:      string;
  unreadCount:        number;
  /** Who to show in the avatar / title row — client sees manager, manager sees client */
  showParticipant?:   "manager" | "client";
  threadRouteBase?:   string;
}

export function ConversationCard({
  conversation,
  currentUserId,
  unreadCount,
  showParticipant = "manager",
  threadRouteBase = "/(client)/messages",
}: ConversationCardProps) {
  const router    = useRouter();
  const msg       = conversation.lastMessage;
  const isMine    = msg?.senderId === currentUserId;
  const statusCfg = PROJECT_STATUS_CONFIG[conversation.projectStatus] ?? {
    label: conversation.projectStatus,
    color: COLORS.zinc400,
  };

  const participant = showParticipant === "client" ? conversation.client : conversation.manager;

  const initials = participant.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasUnread = unreadCount > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.80}
      onPress={() =>
        router.push(`${threadRouteBase}/${conversation.projectId}` as never)
      }
    >
      {/* Avatar with optional unread dot */}
      <View>
        <View style={[styles.avatar, hasUnread && styles.avatarUnread]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {hasUnread && (
          <View style={styles.unreadDot}>
            <Text style={styles.unreadDotText}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[styles.name, hasUnread && styles.nameUnread]}
            numberOfLines={1}
          >
            {participant.name}
          </Text>
          {msg && (
            <Text style={styles.time}>{timeAgo(msg.createdAt)}</Text>
          )}
        </View>

        {/* Project name with status badge */}
        <View style={styles.projectRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusCfg.color },
            ]}
          />
          <Text style={styles.projectName} numberOfLines={1}>
            {conversation.projectTitle}
          </Text>
        </View>

        {/* Last message preview */}
        <Text
          style={[styles.preview, hasUnread && styles.previewUnread]}
          numberOfLines={1}
        >
          {msg
            ? `${isMine ? "You: " : ""}${truncate(msg.message, 72)}`
            : "No messages yet — start the conversation"}
        </Text>
      </View>

      {/* No-message icon for empty threads */}
      {!msg && (
        <MessageCircle size={18} color={COLORS.zinc300} style={{ marginLeft: 4 }} />
      )}
    </TouchableOpacity>
  );
}

export function ConversationCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: COLORS.zinc100 }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.sk, { width: 110, height: 13 }]} />
          <View style={[styles.sk, { width: 40, height: 10 }]} />
        </View>
        <View style={[styles.sk, { width: 140, height: 10, marginVertical: 5 }]} />
        <View style={[styles.sk, { width: "85%", height: 10 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection:   "row",
    alignItems:      "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
    gap:             12,
  },

  avatar: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: COLORS.primary,
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
  },
  avatarUnread: {
    backgroundColor: COLORS.primary,
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.35,
    shadowRadius:    6,
    elevation:       3,
  },
  avatarText: {
    fontSize:   16,
    fontWeight: "700",
    color:      COLORS.white,
  },
  unreadDot: {
    position:        "absolute",
    top:             -2,
    right:           -2,
    minWidth:        18,
    height:          18,
    borderRadius:    9,
    backgroundColor: COLORS.red,
    alignItems:      "center",
    justifyContent:  "center",
    paddingHorizontal: 3,
    borderWidth:     2,
    borderColor:     COLORS.white,
  },
  unreadDotText: {
    fontSize:   9,
    fontWeight: "800",
    color:      COLORS.white,
  },

  content: {
    flex: 1,
    gap:  3,
  },
  topRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
  },
  name: {
    fontSize:   15,
    fontWeight: "600",
    color:      COLORS.zinc900,
    flex:       1,
    marginRight: 8,
  },
  nameUnread: {
    fontWeight: "800",
  },
  time: {
    fontSize: 11,
    color:    COLORS.zinc400,
  },
  projectRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           5,
  },
  statusDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  projectName: {
    fontSize:   12,
    color:      COLORS.zinc500,
    fontWeight: "500",
    flex:       1,
  },
  preview: {
    fontSize:   13,
    color:      COLORS.zinc400,
    lineHeight: 18,
  },
  previewUnread: {
    color:      COLORS.zinc700,
    fontWeight: "600",
  },

  sk: {
    backgroundColor: COLORS.zinc100,
    borderRadius:    5,
  },
  zinc300: { color: "#d4d4d8" },
});
