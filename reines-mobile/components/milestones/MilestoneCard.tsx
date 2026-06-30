import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  CheckCircle2,
  Circle,
  Clock,
  CalendarDays,
  ChevronRight,
  Trash2,
  PlayCircle,
} from "lucide-react-native";
import { COLORS } from "@/constants";
import { shortDate } from "@/lib/format";
import type { Milestone, MilestoneStatus } from "@/types";
import { MilestoneStatusBadge } from "./MilestoneStatusBadge";

interface Props {
  milestone:     Milestone;
  /** If undefined the action buttons are hidden (read-only / client view). */
  onToggle?:     (id: string, status: MilestoneStatus) => void;
  onEdit?:       (milestone: Milestone) => void;
  onDelete?:     (id: string) => void;
  isToggling?:   boolean;
  isDeleting?:   boolean;
  /** Shows a connecting line below (for timeline view). */
  showConnector?: boolean;
}

export function MilestoneCard({
  milestone,
  onToggle,
  onEdit,
  onDelete,
  isToggling  = false,
  isDeleting  = false,
  showConnector = false,
}: Props) {
  const isCompleted = milestone.status === "COMPLETED";
  const isCancelled = milestone.status === "CANCELLED";
  const isEditable  = !!onToggle;

  const isOverdue =
    milestone.dueDate &&
    !isCompleted &&
    !isCancelled &&
    new Date(milestone.dueDate) < new Date();

  return (
    <View style={styles.wrapper}>
      {/* Timeline dot + connector */}
      <View style={styles.timeline}>
        <View
          style={[
            styles.dot,
            isCompleted && styles.dotDone,
            isCancelled && styles.dotCancelled,
          ]}
        >
          {isCompleted ? (
            <CheckCircle2 size={16} color={COLORS.white} />
          ) : milestone.status === "IN_PROGRESS" ? (
            <Clock size={14} color={COLORS.white} />
          ) : (
            <Circle size={14} color={COLORS.zinc400} />
          )}
        </View>
        {showConnector && <View style={styles.connector} />}
      </View>

      {/* Card body */}
      <View
        style={[
          styles.card,
          isCompleted && styles.cardDone,
          isCancelled && styles.cardCancelled,
        ]}
      >
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, (isCompleted || isCancelled) && styles.titleDone]}
            numberOfLines={2}
          >
            {milestone.title}
          </Text>
          <MilestoneStatusBadge status={milestone.status} size="sm" />
        </View>

        {/* Description */}
        {milestone.description ? (
          <Text style={styles.desc} numberOfLines={3}>
            {milestone.description}
          </Text>
        ) : null}

        {/* Due date */}
        {milestone.dueDate ? (
          <View style={styles.datePill}>
            <CalendarDays
              size={11}
              color={isOverdue ? COLORS.red : COLORS.zinc500}
            />
            <Text
              style={[
                styles.dateText,
                isOverdue && styles.dateOverdue,
              ]}
            >
              {isOverdue ? "Overdue · " : "Due "}
              {shortDate(milestone.dueDate)}
            </Text>
          </View>
        ) : null}

        {/* Completed timestamp */}
        {milestone.completedAt ? (
          <View style={styles.datePill}>
            <CheckCircle2 size={11} color={COLORS.green} />
            <Text style={[styles.dateText, { color: COLORS.green }]}>
              Completed {shortDate(milestone.completedAt)}
            </Text>
          </View>
        ) : null}

        {/* Manager actions */}
        {isEditable ? (
          <View style={styles.actions}>
            {/* Toggle button */}
            {!isCancelled ? (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  isCompleted ? styles.btnUndo : styles.btnComplete,
                ]}
                onPress={() => onToggle!(milestone.id, milestone.status)}
                disabled={isToggling || isDeleting}
              >
                {isToggling ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : isCompleted ? (
                  <>
                    <PlayCircle size={13} color={COLORS.white} />
                    <Text style={styles.actionText}>Reopen</Text>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} color={COLORS.white} />
                    <Text style={styles.actionText}>Mark Done</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}

            {/* Edit */}
            {onEdit ? (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => onEdit(milestone)}
                disabled={isToggling || isDeleting}
              >
                <ChevronRight size={16} color={COLORS.primary} />
              </TouchableOpacity>
            ) : null}

            {/* Delete */}
            {onDelete ? (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => onDelete(milestone.id)}
                disabled={isToggling || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={COLORS.red} />
                ) : (
                  <Trash2 size={15} color={COLORS.red} />
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: "row", gap: 12, marginBottom: 4 },

  // Timeline column
  timeline: { alignItems: "center", width: 28 },
  dot: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: COLORS.zinc300,
    alignItems:      "center",
    justifyContent:  "center",
    zIndex:          1,
  },
  dotDone:      { backgroundColor: COLORS.green },
  dotCancelled: { backgroundColor: COLORS.zinc300 },
  connector: {
    flex:            1,
    width:           2,
    backgroundColor: COLORS.zinc200,
    marginTop:       4,
    marginBottom:    -8,
  },

  // Card
  card: {
    flex:            1,
    backgroundColor: COLORS.white,
    borderRadius:    12,
    padding:         14,
    marginBottom:    10,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    4,
    elevation:       2,
  },
  cardDone: {
    backgroundColor: "#f0fdf4",
    borderWidth:     1,
    borderColor:     "#bbf7d0",
  },
  cardCancelled: {
    backgroundColor: COLORS.zinc50,
    opacity:         0.6,
  },

  titleRow: {
    flexDirection:   "row",
    justifyContent:  "space-between",
    alignItems:      "flex-start",
    gap:             8,
    marginBottom:    4,
  },
  title: {
    flex:       1,
    fontSize:   14,
    fontWeight: "600",
    color:      COLORS.zinc800,
    lineHeight: 20,
  },
  titleDone: {
    color:          COLORS.zinc400,
    textDecorationLine: "line-through",
  },

  desc: {
    fontSize:    13,
    color:       COLORS.zinc500,
    lineHeight:  18,
    marginBottom: 8,
  },
  datePill: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            4,
    marginTop:      4,
  },
  dateText:    { fontSize: 11, color: COLORS.zinc500 },
  dateOverdue: { color: COLORS.red, fontWeight: "600" },

  actions: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            8,
    marginTop:      12,
    paddingTop:     12,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc100,
  },
  actionBtn: {
    flexDirection:    "row",
    alignItems:       "center",
    gap:              5,
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:     20,
  },
  btnComplete: { backgroundColor: COLORS.green },
  btnUndo:     { backgroundColor: COLORS.zinc500 },
  actionText:  { fontSize: 12, fontWeight: "600", color: COLORS.white },

  iconBtn: {
    padding:         6,
    marginLeft:      "auto",
  },
});
