import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react-native";
import { COLORS, PAYMENT_STATUS_CONFIG } from "@/constants";
import type { PaymentStatus } from "@/types";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?:  "sm" | "md" | "lg";
}

const ICONS: Record<PaymentStatus, React.ComponentType<any>> = {
  SUCCESS:   CheckCircle,
  PENDING:   Clock,
  FAILED:    XCircle,
  CANCELLED: AlertCircle,
};

export function PaymentStatusBadge({ status, size = "md" }: PaymentStatusBadgeProps) {
  const cfg  = PAYMENT_STATUS_CONFIG[status] ?? { label: status, color: COLORS.zinc400 };
  const Icon = ICONS[status] ?? AlertCircle;

  const iconSize  = size === "sm" ? 12 : size === "lg" ? 18 : 14;
  const fontSize  = size === "sm" ? 10 : size === "lg" ? 14 : 12;
  const padH      = size === "sm" ? 7  : size === "lg" ? 12 : 10;
  const padV      = size === "sm" ? 3  : size === "lg" ? 6  : 4;

  return (
    <View style={[styles.badge, { backgroundColor: cfg.color + "18", paddingHorizontal: padH, paddingVertical: padV }]}>
      <Icon size={iconSize} color={cfg.color} />
      <Text style={[styles.label, { color: cfg.color, fontSize }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems:    "center",
    borderRadius:  100,
    gap:           5,
  },
  label: {
    fontWeight: "700",
  },
});
