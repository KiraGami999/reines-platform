import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Clock,
  MessageCircle,
  CreditCard,
  User,
} from "lucide-react-native";
import { COLORS, PROJECT_STATUS_CONFIG } from "@/constants";
import { formatMWK, timeAgo, shortDate } from "@/lib/format";
import type { MobileProject } from "@/types";

interface ProjectCardProps {
  project:    MobileProject;
  /** Navigation target — defaults to /(client)/projects/:id */
  routeBase?: string;
}

export function ProjectCard({ project, routeBase = "/(client)/projects" }: ProjectCardProps) {
  const router    = useRouter();
  const config    = PROJECT_STATUS_CONFIG[project.status] ?? { label: project.status, color: COLORS.zinc400 };
  const latest    = project.updates[0];
  const progress  = latest?.progressPercent ?? null;
  const hasStats  = project._count.messages > 0 || project._count.payments > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.78}
      onPress={() => router.push(`${routeBase}/${project.id}` as never)}
    >
      {/* Coloured left accent bar */}
      <View style={[styles.accent, { backgroundColor: config.color }]} />

      <View style={styles.inner}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title} numberOfLines={2}>{project.title}</Text>
            <View style={[styles.badge, { backgroundColor: config.color + "20" }]}>
              <View style={[styles.dot, { backgroundColor: config.color }]} />
              <Text style={[styles.badgeLabel, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.zinc400} style={{ marginTop: 2 }} />
        </View>

        {/* ── Description ────────────────────────────────────────────── */}
        {project.description && (
          <Text style={styles.description} numberOfLines={2}>{project.description}</Text>
        )}

        {/* ── Progress bar ───────────────────────────────────────────── */}
        {progress !== null && (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: config.color }]} />
            </View>
            <Text style={styles.progressLabel}>{progress}%</Text>
          </View>
        )}

        {/* ── Meta grid ──────────────────────────────────────────────── */}
        <View style={styles.meta}>
          {project.budget && (
            <View style={styles.metaItem}>
              <CreditCard size={11} color={COLORS.zinc400} />
              <Text style={styles.metaText}>{formatMWK(project.budget)}</Text>
            </View>
          )}
          {project.manager && (
            <View style={styles.metaItem}>
              <User size={11} color={COLORS.zinc400} />
              <Text style={styles.metaText} numberOfLines={1}>{project.manager.name}</Text>
            </View>
          )}
        </View>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Clock size={11} color={COLORS.zinc400} />
            <Text style={styles.footerText}>
              {latest ? `Updated ${timeAgo(latest.createdAt)}` : `Created ${shortDate(project.createdAt)}`}
            </Text>
          </View>
          {hasStats && (
            <View style={styles.footerRight}>
              {project._count.messages > 0 && (
                <View style={styles.statChip}>
                  <MessageCircle size={10} color={COLORS.zinc500} />
                  <Text style={styles.statText}>{project._count.messages}</Text>
                </View>
              )}
              {project._count.updates > 0 && (
                <View style={styles.statChip}>
                  <Text style={styles.statText}>{project._count.updates} updates</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ProjectCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: COLORS.zinc200 }]} />
      <View style={[styles.inner, { gap: 10 }]}>
        <View style={[styles.sk, { width: "75%", height: 15 }]} />
        <View style={[styles.sk, { width: 70, height: 10 }]} />
        <View style={[styles.sk, { height: 5, marginVertical: 4 }]} />
        <View style={styles.footer}>
          <View style={[styles.sk, { width: 100, height: 10 }]} />
          <View style={[styles.sk, { width: 50, height: 10 }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    14,
    flexDirection:   "row",
    marginBottom:    12,
    overflow:        "hidden",
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    6,
    elevation:       3,
  },
  accent: {
    width: 4,
  },
  inner: {
    flex:    1,
    padding: 14,
    gap:     6,
  },

  // Header
  header: {
    flexDirection:  "row",
    alignItems:     "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex:        1,
    marginRight: 8,
    gap:         5,
  },
  title: {
    fontSize:   16,
    fontWeight: "700",
    color:      COLORS.zinc900,
    lineHeight: 21,
  },
  badge: {
    flexDirection:     "row",
    alignItems:        "center",
    alignSelf:         "flex-start",
    borderRadius:      20,
    paddingHorizontal: 8,
    paddingVertical:   3,
    gap:               4,
  },
  dot: {
    width:        5,
    height:       5,
    borderRadius: 3,
  },
  badgeLabel: {
    fontSize:   11,
    fontWeight: "600",
  },

  // Description
  description: {
    fontSize:   13,
    color:      COLORS.zinc500,
    lineHeight: 18,
  },

  // Progress
  progressRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           8,
    marginTop:     2,
  },
  progressTrack: {
    flex:            1,
    height:          5,
    backgroundColor: COLORS.zinc100,
    borderRadius:    3,
    overflow:        "hidden",
  },
  progressFill: {
    height:       "100%",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize:   11,
    color:      COLORS.zinc500,
    fontWeight: "600",
    width:      32,
    textAlign:  "right",
  },

  // Meta
  meta: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           10,
    marginTop:     2,
  },
  metaItem: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           4,
  },
  metaText: {
    fontSize: 12,
    color:    COLORS.zinc500,
  },

  // Footer
  footer: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginTop:      4,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           4,
    flex:          1,
  },
  footerText: {
    fontSize: 11,
    color:    COLORS.zinc400,
  },
  footerRight: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           6,
  },
  statChip: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               3,
    backgroundColor:   COLORS.zinc100,
    borderRadius:      8,
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  statText: {
    fontSize: 10,
    color:    COLORS.zinc500,
  },

  sk: {
    backgroundColor: COLORS.zinc100,
    borderRadius:    5,
    width:           "100%",
  },
});
