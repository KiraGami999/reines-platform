import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants";
import { fullDateTime } from "@/lib/format";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message:     Message;
  isMine:      boolean;
  showSender:  boolean;   // show sender name above bubble (first in a run)
  showTime:    boolean;   // show timestamp below bubble (last in a run)
}

export function MessageBubble({
  message,
  isMine,
  showSender,
  showTime,
}: MessageBubbleProps) {
  const isOptimistic = message.id.startsWith("optimistic_");

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      {/* Sender name — shown above a run of messages from the same person */}
      {!isMine && showSender && (
        <Text style={styles.senderName}>{message.sender.name}</Text>
      )}

      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          isOptimistic && styles.bubbleOptimistic,
        ]}
      >
        <Text style={[styles.text, isMine ? styles.textMine : styles.textTheirs]}>
          {message.message}
        </Text>
      </View>

      {/* Timestamp — shown below the last bubble in a run */}
      {showTime && (
        <Text style={[styles.time, isMine ? styles.timeMine : styles.timeTheirs]}>
          {isOptimistic ? "Sending…" : fullDateTime(message.createdAt)}
        </Text>
      )}
    </View>
  );
}

/** Skeleton bubbles shown while the thread is loading */
export function MessageBubbleSkeleton({ mine }: { mine: boolean }) {
  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <View
        style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleTheirs,
          styles.skeletonBubble,
          { width: mine ? 180 : 140 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 2,
    maxWidth:     "80%",
  },
  rowMine: {
    alignSelf:  "flex-end",
    alignItems: "flex-end",
  },
  rowTheirs: {
    alignSelf:  "flex-start",
    alignItems: "flex-start",
  },

  senderName: {
    fontSize:     11,
    fontWeight:   "600",
    color:        COLORS.zinc500,
    marginBottom: 2,
    marginLeft:   4,
  },

  bubble: {
    borderRadius:      18,
    paddingHorizontal: 14,
    paddingVertical:   9,
    maxWidth:          "100%",
  },
  bubbleMine: {
    backgroundColor:       COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor:      COLORS.white,
    borderBottomLeftRadius: 4,
    shadowColor:          "#000",
    shadowOffset:         { width: 0, height: 1 },
    shadowOpacity:        0.06,
    shadowRadius:         3,
    elevation:            1,
  },
  bubbleOptimistic: {
    opacity: 0.65,
  },

  text: {
    fontSize:   15,
    lineHeight: 21,
  },
  textMine: {
    color: COLORS.white,
  },
  textTheirs: {
    color: COLORS.zinc900,
  },

  time: {
    fontSize:  10,
    marginTop: 3,
    color:     COLORS.zinc400,
  },
  timeMine: {
    textAlign: "right",
    marginRight: 2,
  },
  timeTheirs: {
    textAlign: "left",
    marginLeft: 2,
  },

  skeletonBubble: {
    height:          36,
    backgroundColor: COLORS.zinc100,
  },
});
