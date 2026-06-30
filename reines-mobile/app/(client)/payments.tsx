import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { COLORS, PAYMENT_STATUS_CONFIG } from "@/constants";
import { usePayments } from "@/hooks/usePayments";
import { PaymentCard, PaymentCardSkeleton } from "@/components/payments/PaymentCard";
import type { PaymentStatus } from "@/types";

type Filter = "ALL" | PaymentStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL",       label: "All"       },
  { key: "PENDING",   label: "Pending"   },
  { key: "SUCCESS",   label: "Paid"      },
  { key: "FAILED",    label: "Failed"    },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function ClientPaymentsScreen() {
  const router              = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");
  const { data, isLoading, isError, refetch, isRefetching } = usePayments();

  const filtered = useMemo(() => {
    if (!data) return [];
    return filter === "ALL" ? data : data.filter((p) => p.status === filter);
  }, [data, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: data?.length ?? 0 };
    for (const f of FILTERS.slice(1)) {
      c[f.key] = data?.filter((p) => p.status === f.key).length ?? 0;
    }
    return c;
  }, [data]);

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>Your payment history</Text>
        </View>
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => router.push("/(client)/payments/new" as never)}
        >
          <Plus size={18} color={COLORS.white} />
          <Text style={styles.fabLabel}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.key}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const active = filter === item.key;
          const cfg    = item.key === "ALL" ? null : PAYMENT_STATUS_CONFIG[item.key];
          const color  = cfg?.color ?? COLORS.primary;
          return (
            <TouchableOpacity
              style={[styles.filterChip, active && { backgroundColor: color, borderColor: color }]}
              onPress={() => setFilter(item.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterLabel, active && { color: COLORS.white }]}>
                {item.label}
              </Text>
              {counts[item.key] > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: active ? "rgba(255,255,255,0.3)" : color + "20" }]}>
                  <Text style={[styles.filterBadgeText, { color: active ? COLORS.white : color }]}>
                    {counts[item.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Payment list */}
      {isLoading ? (
        <FlatList
          data={[...Array(4)]}
          keyExtractor={(_, i) => `sk-${i}`}
          contentContainerStyle={styles.list}
          renderItem={() => <PaymentCardSkeleton />}
        />
      ) : isError ? (
        <View style={styles.centred}>
          <Text style={styles.errorText}>Failed to load payments.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryLabel}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.centred}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>
                {filter === "ALL" ? "No payments yet" : `No ${PAYMENT_STATUS_CONFIG[filter]?.label.toLowerCase() ?? filter} payments`}
              </Text>
              <Text style={styles.emptyBody}>
                {filter === "ALL"
                  ? "Payments you make will appear here."
                  : "Try switching to another filter."}
              </Text>
            </View>
          }
          renderItem={({ item }) => <PaymentCard payment={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.zinc50 },
  header: {
    flexDirection:    "row",
    alignItems:       "center",
    justifyContent:   "space-between",
    paddingHorizontal: 20,
    paddingTop:       16,
    paddingBottom:    12,
    backgroundColor:  COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  title:    { fontSize: 22, fontWeight: "800", color: COLORS.zinc900 },
  subtitle: { fontSize: 13, color: COLORS.zinc400, marginTop: 2 },
  fab: {
    flexDirection:     "row",
    alignItems:        "center",
    backgroundColor:   COLORS.primary,
    borderRadius:      22,
    paddingHorizontal: 14,
    paddingVertical:   9,
    gap:               6,
    shadowColor:       COLORS.primary,
    shadowOffset:      { width: 0, height: 3 },
    shadowOpacity:     0.3,
    shadowRadius:      6,
    elevation:         4,
  },
  fabLabel: { color: COLORS.white, fontWeight: "700", fontSize: 13 },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical:   12,
    gap:               8,
  },
  filterChip: {
    flexDirection:     "row",
    alignItems:        "center",
    borderRadius:      20,
    borderWidth:       1.5,
    borderColor:       COLORS.zinc200,
    paddingHorizontal: 12,
    paddingVertical:   6,
    gap:               5,
    backgroundColor:   COLORS.white,
  },
  filterLabel: { fontSize: 13, fontWeight: "600", color: COLORS.zinc700 },
  filterBadge: {
    borderRadius:      10,
    paddingHorizontal: 5,
    paddingVertical:   1,
    minWidth:          18,
    alignItems:        "center",
  },
  filterBadgeText: { fontSize: 10, fontWeight: "800" },
  list:      { paddingHorizontal: 16, paddingBottom: 24 },
  listEmpty: { flexGrow: 1, justifyContent: "center" },
  centred:   { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  errorText: { fontSize: 14, color: COLORS.red, textAlign: "center", marginBottom: 12 },
  retryBtn:  { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  retryLabel:{ color: COLORS.white, fontWeight: "700", fontSize: 13 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle:{ fontSize: 16, fontWeight: "700", color: COLORS.zinc700, textAlign: "center", marginBottom: 6 },
  emptyBody: { fontSize: 13, color: COLORS.zinc400, textAlign: "center" },
});
