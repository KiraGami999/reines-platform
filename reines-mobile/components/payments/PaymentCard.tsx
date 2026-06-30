import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Banknote, CreditCard } from "lucide-react-native";
import { COLORS, PAYMENT_STATUS_CONFIG } from "@/constants";
import { formatMWK, shortDate } from "@/lib/format";
import type { Payment } from "@/types";

interface PaymentCardProps {
  payment: Payment;
}

const METHOD_LABEL: Record<string, string> = {
  PAYCHANGU: "Online",
  CASH:      "Cash",
};

export function PaymentCard({ payment }: PaymentCardProps) {
  const router = useRouter();
  const cfg    = PAYMENT_STATUS_CONFIG[payment.status] ?? { label: payment.status, color: COLORS.zinc400 };
  const isCash = payment.method === "CASH";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.78}
      onPress={() => router.push(`/(client)/payments/${payment.id}` as never)}
    >
      {/* Method icon */}
      <View style={[styles.iconWrap, { backgroundColor: cfg.color + "18" }]}>
        {isCash
          ? <Banknote size={20} color={cfg.color} />
          : <CreditCard size={20} color={cfg.color} />}
      </View>

      {/* Middle */}
      <View style={styles.body}>
        <Text style={styles.project} numberOfLines={1}>
          {payment.project?.title ?? "Unknown project"}
        </Text>
        <Text style={styles.desc} numberOfLines={1}>
          {payment.description ?? "Payment"}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{METHOD_LABEL[payment.method] ?? payment.method}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>{shortDate(payment.createdAt)}</Text>
        </View>
      </View>

      {/* Right: amount + status */}
      <View style={styles.right}>
        <Text style={styles.amount}>{formatMWK(payment.amount)}</Text>
        <View style={[styles.badge, { backgroundColor: cfg.color + "18" }]}>
          <Text style={[styles.badgeLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <ChevronRight size={14} color={COLORS.zinc300} style={{ marginTop: 2 }} />
      </View>
    </TouchableOpacity>
  );
}

export function PaymentCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: COLORS.zinc100 }]} />
      <View style={styles.body}>
        <View style={[styles.sk, { width: 130, height: 13, marginBottom: 6 }]} />
        <View style={[styles.sk, { width: 90, height: 10, marginBottom: 6 }]} />
        <View style={[styles.sk, { width: 70, height: 9 }]} />
      </View>
      <View style={styles.right}>
        <View style={[styles.sk, { width: 70, height: 14, marginBottom: 8 }]} />
        <View style={[styles.sk, { width: 50, height: 10 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: COLORS.white,
    borderRadius:    14,
    padding:         14,
    marginBottom:    10,
    gap:             12,
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.06,
    shadowRadius:    4,
    elevation:       2,
  },
  iconWrap: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
  },
  body: {
    flex: 1,
    gap:  3,
  },
  project: {
    fontSize:   14,
    fontWeight: "700",
    color:      COLORS.zinc900,
  },
  desc: {
    fontSize: 12,
    color:    COLORS.zinc500,
  },
  meta: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           6,
    marginTop:     2,
  },
  metaText: {
    fontSize: 11,
    color:    COLORS.zinc400,
  },
  metaDot: {
    width:        3,
    height:       3,
    borderRadius: 2,
    backgroundColor: COLORS.zinc300,
  },
  right: {
    alignItems: "flex-end",
    gap:        5,
  },
  amount: {
    fontSize:   14,
    fontWeight: "800",
    color:      COLORS.zinc900,
  },
  badge: {
    borderRadius:      10,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  badgeLabel: {
    fontSize:   10,
    fontWeight: "700",
  },
  sk: {
    backgroundColor: COLORS.zinc100,
    borderRadius:    5,
  },
});
