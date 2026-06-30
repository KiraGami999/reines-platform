import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, MessageSquare, FileText, User } from "lucide-react-native";
import { COLORS, PROJECT_STATUS_CONFIG } from "@/constants";
import { shortDate, timeAgo } from "@/lib/format";
import type { ManagedProject } from "@/types";

interface ManagedProjectCardProps {
  project:    ManagedProject;
  routeBase?: string;
}

export function ManagedProjectCard({
  project,
  routeBase = "/(manager)/projects",
}: ManagedProjectCardProps) {
  const router  = useRouter();
  const cfg     = PROJECT_STATUS_CONFIG[project.status] ?? { label: project.status, color: COLORS.zinc400 };
  const lastUpd = project.updates[0];
  const progress = lastUpd?.progressPercent ?? 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.78}
      onPress={() => router.push(`${routeBase}/${project.id}` as never)}
    >
      {/* Coloured left accent bar */}
      <View style={[styles.accent, { backgroundColor: cfg.color }]} />

      <View style={styles.body}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
          <ChevronRight size={14} color={COLORS.zinc300} />
        </View>

        {/* Client */}
        <View style={styles.clientRow}>
          <User size={11} color={COLORS.zinc400} />
          <Text style={styles.clientName} numberOfLines={1}>{project.client.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.color + "1a" }]}>
            <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` as `${number}%`, backgroundColor: cfg.color }]} />
        </View>
        <Text style={styles.progressLabel}>{progress}% complete</Text>

        {/* Footer chips */}
        <View style={styles.chips}>
          <Chip icon={<MessageSquare size={10} color={COLORS.zinc400} />} label={`${project._count.messages} msgs`} />
          <Chip icon={<FileText    size={10} color={COLORS.zinc400} />} label={`${project._count.updates} updates`} />
          {project.endDate && (
            <Chip
              label={`Due ${shortDate(project.endDate)}`}
              color={new Date(project.endDate) < new Date() ? COLORS.red : COLORS.zinc400}
            />
          )}
          {lastUpd && (
            <Chip label={`Updated ${timeAgo(lastUpd.createdAt)}`} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Chip({ icon, label, color }: { icon?: React.ReactNode; label: string; color?: string }) {
  return (
    <View style={styles.chip}>
      {icon}
      <Text style={[styles.chipText, color ? { color } : undefined]}>{label}</Text>
    </View>
  );
}

export function ManagedProjectCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: COLORS.zinc200 }]} />
      <View style={[styles.body, { gap: 8 }]}>
        <View style={[styles.sk, { width: "80%", height: 14 }]} />
        <View style={[styles.sk, { width: "50%", height: 11 }]} />
        <View style={[styles.sk, { height: 6, borderRadius: 3, marginVertical: 2 }]} />
        <View style={styles.chips}>
          {[0, 1].map((i) => <View key={i} style={[styles.sk, { width: 60, height: 20, borderRadius: 10 }]} />)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection:   "row",
    backgroundColor: COLORS.white,
    borderRadius:    14,
    overflow:        "hidden",
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.06,
    shadowRadius:    5,
    elevation:       2,
  },
  accent: { width: 4 },
  body: {
    flex:    1,
    padding: 14,
    gap:     6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems:    "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 14, fontWeight: "700", color: COLORS.zinc900, flex: 1 },
  clientRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           5,
  },
  clientName: { fontSize: 12, color: COLORS.zinc500, flex: 1 },
  statusBadge: {
    borderRadius:      8,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  statusLabel: { fontSize: 10, fontWeight: "700" },
  progressTrack: {
    height:          6,
    borderRadius:    3,
    backgroundColor: COLORS.zinc100,
    overflow:        "hidden",
    marginTop:       2,
  },
  progressFill:  { height: "100%", borderRadius: 3 },
  progressLabel: { fontSize: 10, color: COLORS.zinc400 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  chip: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               4,
    backgroundColor:   COLORS.zinc100,
    borderRadius:      10,
    paddingHorizontal: 7,
    paddingVertical:   3,
  },
  chipText: { fontSize: 10, color: COLORS.zinc500, fontWeight: "600" },
  sk:       { backgroundColor: COLORS.zinc100, borderRadius: 6, alignSelf: "stretch" },
});
