import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, RefreshControl, Linking, Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft, CreditCard, Banknote, Calendar,
  FileText, AlertCircle, ExternalLink,
} from "lucide-react-native";
import { COLORS, PAYMENT_STATUS_CONFIG } from "@/constants";
import { usePayment } from "@/hooks/usePayments";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { formatMWK, fullDateTime } from "@/lib/format";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function PaymentDetailScreen() {
  const router  = useRouter();
  const { id }  = useLocalSearchParams<{ id: string }>();
  const { data: payment, isLoading, isError, refetch, isRefetching } = usePayment(id!);

  const cfg = payment ? (PAYMENT_STATUS_CONFIG[payment.status] ?? { label: payment.status, color: COLORS.zinc400 }) : null;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={22} color={COLORS.zinc900} />
          </TouchableOpacity>
        </View>
        <View style={styles.centred}>
          <Text style={styles.loadingText}>Loading payment…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !payment) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={22} color={COLORS.zinc900} />
          </TouchableOpacity>
        </View>
        <View style={styles.centred}>
          <AlertCircle size={36} color={COLORS.red} />
          <Text style={styles.errorText}>Failed to load payment.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryLabel}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCash = payment.method === "CASH";

  return (
    <SafeAreaView style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color={COLORS.zinc900} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Payment Detail</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
      >
        {/* Hero card */}
        <View style={[styles.hero, { borderTopColor: cfg?.color ?? COLORS.primary }]}>
          <View style={[styles.heroIcon, { backgroundColor: (cfg?.color ?? COLORS.primary) + "18" }]}>
            {isCash
              ? <Banknote size={28} color={cfg?.color ?? COLORS.primary} />
              : <CreditCard size={28} color={cfg?.color ?? COLORS.primary} />}
          </View>
          <Text style={styles.heroAmount}>{formatMWK(payment.amount)}</Text>
          <Text style={styles.heroCurrency}>{payment.currency}</Text>
          <PaymentStatusBadge status={payment.status} size="lg" />
          {payment.project && (
            <Text style={styles.heroProject}>{payment.project.title}</Text>
          )}
        </View>

        {/* Admin note (if rejected) */}
        {payment.adminNotes && (
          <View style={styles.noteCard}>
            <AlertCircle size={16} color={COLORS.yellow} />
            <Text style={styles.noteText}>{payment.adminNotes}</Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Row label="Method"       value={isCash ? "Cash" : "Online (PayChangu)"} />
          <Row label="Reference"    value={payment.txRef} />
          <Row label="Description"  value={payment.description ?? "—"} />
          <Row label="Submitted"    value={fullDateTime(payment.createdAt)} />
          {payment.paidAt && (
            <Row label="Paid at"    value={fullDateTime(payment.paidAt)} />
          )}
        </View>

        {/* Cash receipt */}
        {isCash && payment.receiptUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt</Text>
            <Image
              source={{ uri: payment.receiptUrl }}
              style={styles.receipt}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Open checkout URL (PENDING online payments) */}
        {!isCash && payment.checkoutUrl && payment.status === "PENDING" && (
          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.85}
            onPress={() => Linking.openURL(payment.checkoutUrl!)}
          >
            <ExternalLink size={16} color={COLORS.white} />
            <Text style={styles.continueBtnLabel}>Continue to Payment</Text>
          </TouchableOpacity>
        )}

        {/* Status explanation */}
        <View style={styles.statusHint}>
          <FileText size={14} color={COLORS.zinc400} />
          <Text style={styles.statusHintText}>
            {payment.status === "PENDING" && isCash
              ? "Your cash payment is awaiting admin approval. You will be notified once it is reviewed."
              : payment.status === "PENDING"
              ? "Complete your payment by tapping 'Continue to Payment' above."
              : payment.status === "SUCCESS"
              ? "This payment has been confirmed and recorded."
              : payment.status === "FAILED"
              ? "This payment was not completed. Please try again or contact support."
              : "This payment was cancelled."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: COLORS.zinc50 },
  topBar: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    paddingHorizontal: 20,
    paddingVertical:  14,
    backgroundColor:  COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  topBarTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  scroll:  { padding: 20, paddingBottom: 48, gap: 16 },
  centred: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.zinc400 },
  errorText:   { fontSize: 14, color: COLORS.red, textAlign: "center" },
  retryBtn:    { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  retryLabel:  { color: COLORS.white, fontWeight: "700", fontSize: 13 },

  hero: {
    alignItems:     "center",
    backgroundColor: COLORS.white,
    borderRadius:   18,
    padding:        24,
    gap:            8,
    borderTopWidth: 4,
    shadowColor:    "#000",
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.07,
    shadowRadius:   8,
    elevation:      3,
  },
  heroIcon:   { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroAmount: { fontSize: 30, fontWeight: "900", color: COLORS.zinc900, letterSpacing: -0.5 },
  heroCurrency:{ fontSize: 13, color: COLORS.zinc400, marginTop: -6 },
  heroProject:{ fontSize: 13, color: COLORS.zinc500, marginTop: 4, textAlign: "center" },

  noteCard: {
    flexDirection:  "row",
    alignItems:     "flex-start",
    gap:            10,
    backgroundColor: "#fef9c3",
    borderRadius:   12,
    padding:        14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.yellow,
  },
  noteText: { flex: 1, fontSize: 13, color: "#713f12", lineHeight: 18 },

  section:      { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.zinc400, textTransform: "uppercase", letterSpacing: 0.5 },

  row:        { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  rowLabel:   { fontSize: 13, color: COLORS.zinc500, flex: 1 },
  rowValue:   { fontSize: 13, fontWeight: "600", color: COLORS.zinc900, flex: 2, textAlign: "right" },

  receipt: {
    width:        "100%",
    height:       240,
    borderRadius: 10,
    marginTop:    4,
    backgroundColor: COLORS.zinc100,
  },

  continueBtn: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "center",
    backgroundColor:   COLORS.primary,
    borderRadius:      14,
    padding:           16,
    gap:               8,
    shadowColor:       COLORS.primary,
    shadowOffset:      { width: 0, height: 3 },
    shadowOpacity:     0.25,
    shadowRadius:      6,
    elevation:         4,
  },
  continueBtnLabel: { fontSize: 15, fontWeight: "700", color: COLORS.white },

  statusHint: {
    flexDirection: "row",
    alignItems:    "flex-start",
    gap:           8,
    paddingHorizontal: 4,
  },
  statusHintText: { flex: 1, fontSize: 12, color: COLORS.zinc400, lineHeight: 17 },

  yellow: { color: COLORS.yellow },
});
