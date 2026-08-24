import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Info } from "lucide-react-native";
import { COLORS } from "@/constants";

/**
 * Clients no longer record payments themselves.
 * PMs / admins record cash; admins approve before balances update.
 */
export default function NewPaymentScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={COLORS.zinc700} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Payments</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Info size={28} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Payments are handled for you</Text>
        <Text style={styles.copy}>
          Your project manager or the Reines office records cash payments. An admin confirms
          each one before it counts toward your project balance.
        </Text>
        <Text style={styles.copySecondary}>
          You can view payment history and receipts from the Payments tab.
        </Text>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.replace("/(client)/payments" as never)}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>View my payments</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.zinc50,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.zinc100,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.zinc900,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.zinc900,
    textAlign: "center",
    marginBottom: 12,
  },
  copy: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.zinc600,
    textAlign: "center",
    marginBottom: 10,
  },
  copySecondary: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.zinc500,
    textAlign: "center",
    marginBottom: 28,
  },
  cta: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  ctaText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
