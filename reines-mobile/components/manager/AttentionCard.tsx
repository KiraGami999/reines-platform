import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { AlertTriangle, Calendar, ChevronRight } from "lucide-react-native";
import { COLORS, PROJECT_STATUS_CONFIG } from "@/constants";
import { FONTS, RADII } from "@/constants/theme";
import { shortDate, timeAgo } from "@/lib/format";
import type { ManagedProject } from "@/types";

// ─── Needs-Attention card ──────────────────────────────────────────────────────

interface AttentionCardProps {
  project: ManagedProject;
}

export function AttentionCard({ project }: AttentionCardProps) {
  const router   = useRouter();
  const lastUpd  = project.updates[0];
  const daysSince = lastUpd
    ? Math.floor((Date.now() - new Date(lastUpd.createdAt).getTime()) / 86_400_000)
    : null;

  return (
    <TouchableOpacity
      style={styles.attentionCard}
      activeOpacity={0.78}
      onPress={() => router.push(`/(manager)/projects/${project.id}` as never)}
    >
      <View style={styles.attentionIcon}>
        <AlertTriangle size={16} color={COLORS.yellow} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
        <Text style={styles.sub}>
          {lastUpd
            ? `No update for ${daysSince}d (last: ${timeAgo(lastUpd.createdAt)})`
            : "No updates posted yet"}
        </Text>
        <Text style={styles.client}>{project.client.name}</Text>
      </View>
      <ChevronRight size={14} color={COLORS.zinc300} />
    </TouchableOpacity>
  );
}

// ─── Upcoming deadline card ────────────────────────────────────────────────────

interface DeadlineCardProps {
  project: ManagedProject;
}

export function DeadlineCard({ project }: DeadlineCardProps) {
  const router    = useRouter();
  const cfg       = PROJECT_STATUS_CONFIG[project.status] ?? { label: project.status, color: COLORS.zinc400 };
  const daysLeft  = project.endDate
    ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86_400_000)
    : null;
  const isUrgent  = daysLeft !== null && daysLeft <= 7;

  return (
    <TouchableOpacity
      style={[styles.deadlineCard, isUrgent && styles.deadlineUrgent]}
      activeOpacity={0.78}
      onPress={() => router.push(`/(manager)/projects/${project.id}` as never)}
    >
      <View style={[styles.deadlineIcon, { backgroundColor: (isUrgent ? COLORS.red : COLORS.primary) + "14" }]}>
        <Calendar size={16} color={isUrgent ? COLORS.red : COLORS.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
        <Text style={styles.client}>{project.client.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: cfg.color + "18" }]}>
          <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      <View style={styles.deadlineRight}>
        <Text style={[styles.daysLeft, { color: isUrgent ? COLORS.red : COLORS.primary }]}>
          {daysLeft !== null ? `${daysLeft}d` : "—"}
        </Text>
        <Text style={styles.deadlineDate}>{shortDate(project.endDate)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Attention
  attentionCard: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: COLORS.yellowBg,
    borderRadius:    RADII.md,
    padding:         12,
    gap:             10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.yellow,
  },
  attentionIcon: {
    width:          32,
    height:         32,
    borderRadius:   16,
    backgroundColor: COLORS.yellow + "22",
    alignItems:     "center",
    justifyContent: "center",
  },
  body:   { flex: 1, gap: 2 },
  title:  { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.zinc900 },
  sub:    { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.yellowText },
  client: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.zinc500 },

  // Deadline
  deadlineCard: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: COLORS.white,
    borderRadius:    12,
    padding:         12,
    gap:             10,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
    elevation:       2,
  },
  deadlineUrgent: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.red,
    backgroundColor: COLORS.redBg,
  },
  deadlineIcon: {
    width:          32,
    height:         32,
    borderRadius:   16,
    alignItems:     "center",
    justifyContent: "center",
  },
  statusBadge: {
    borderRadius:      8,
    paddingHorizontal: 6,
    paddingVertical:   2,
    alignSelf:         "flex-start",
    marginTop:         2,
  },
  statusLabel: { fontSize: 9, fontWeight: "700" },
  deadlineRight: { alignItems: "center", minWidth: 36 },
  daysLeft:      { fontSize: 18, fontWeight: "900" },
  deadlineDate:  { fontSize: 9,  color: COLORS.zinc400 },
});
