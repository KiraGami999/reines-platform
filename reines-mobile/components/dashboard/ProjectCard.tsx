import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Clock } from "lucide-react-native";
import { COLORS, PROJECT_STATUS_CONFIG } from "@/constants";
import { FONTS, RADII, SHADOW } from "@/constants/theme";
import { timeAgo, formatMWK } from "@/lib/format";
import type { DashboardProject } from "@/types";

interface ProjectCardProps {
  project: DashboardProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router  = useRouter();
  const config  = PROJECT_STATUS_CONFIG[project.status] ?? { label: project.status, color: COLORS.zinc400 };
  const latest  = project.updates[0];
  const progress = latest?.progressPercent ?? null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.80}
      onPress={() => router.push(`/(client)/projects/${project.id}` as never)}
    >
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
          <View style={[styles.badge, { backgroundColor: config.color + "20" }]}>
            <View style={[styles.badgeDot, { backgroundColor: config.color }]} />
            <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
        <ChevronRight size={16} color={COLORS.zinc400} />
      </View>

      {/* Progress bar */}
      {progress !== null && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{progress}%</Text>
        </View>
      )}

      {/* Footer row */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Clock size={11} color={COLORS.zinc400} />
          <Text style={styles.footerText}>
            {latest ? `Updated ${timeAgo(latest.createdAt)}` : "No updates yet"}
          </Text>
        </View>
        {project.budget && (
          <Text style={styles.budget}>{formatMWK(parseFloat(project.budget))}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function ProjectCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <View style={[styles.skeleton, { width: 140, height: 14, marginBottom: 6 }]} />
          <View style={[styles.skeleton, { width: 70, height: 10 }]} />
        </View>
      </View>
      <View style={[styles.skeleton, { height: 6, marginVertical: 12, borderRadius: 3 }]} />
      <View style={styles.footer}>
        <View style={[styles.skeleton, { width: 100, height: 10 }]} />
        <View style={[styles.skeleton, { width: 60, height: 10 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    RADII.md,
    padding:         14,
    marginBottom:    10,
    borderWidth:     1,
    borderColor:     COLORS.zinc200,
    ...SHADOW.card,
  },
  header: {
    flexDirection:  "row",
    alignItems:     "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize:     15,
    fontFamily:   FONTS.semibold,
    color:        COLORS.zinc900,
    marginBottom: 6,
  },
  badge: {
    flexDirection:  "row",
    alignItems:     "center",
    alignSelf:      "flex-start",
    borderRadius:   20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  badgeDot: {
    width:        5,
    height:       5,
    borderRadius: 3,
  },
  badgeText: {
    fontSize:   10,
    fontFamily: FONTS.semibold,
  },
  progressWrap: {
    flexDirection:  "row",
    alignItems:     "center",
    marginVertical: 12,
    gap:            8,
  },
  progressTrack: {
    flex:         1,
    height:       5,
    backgroundColor: COLORS.zinc100,
    borderRadius: 3,
    overflow:     "hidden",
  },
  progressFill: {
    height:          "100%",
    backgroundColor: COLORS.primary,
    borderRadius:    3,
  },
  progressLabel: {
    fontSize:   11,
    color:      COLORS.zinc500,
    fontFamily: FONTS.semibold,
    width:      30,
    textAlign:  "right",
  },
  footer: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginTop:      6,
  },
  footerItem: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           4,
  },
  footerText: {
    fontSize:   11,
    fontFamily: FONTS.regular,
    color:      COLORS.zinc400,
  },
  budget: {
    fontSize:   11,
    fontFamily: FONTS.semibold,
    color:      COLORS.zinc500,
  },
  skeleton: {
    backgroundColor: COLORS.zinc100,
    borderRadius:    6,
  },
});
