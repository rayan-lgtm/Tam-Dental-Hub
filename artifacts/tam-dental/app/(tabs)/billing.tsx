import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAppContext, type Invoice } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const { payInvoice } = useAppContext();
  const { t, language } = useLanguage();
  const locale = language === "ar" ? "ar-SA" : "en-US";

  const statusConfig = {
    paid: { color: Colors.success, bg: Colors.successLight, label: t.paid },
    unpaid: { color: Colors.danger, bg: Colors.dangerLight, label: t.unpaid },
    partial: { color: Colors.warning, bg: Colors.warningLight, label: t.unpaid },
  }[invoice.status];

  const handlePay = () => {
    Alert.alert(
      t.payConfirmTitle,
      t.payConfirmMsg(invoice.currency, invoice.amount.toLocaleString(), invoice.description),
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.payNow,
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            payInvoice(invoice.id);
            Alert.alert(t.paymentSuccess, t.paymentSuccessMsg);
          },
        },
      ]
    );
  };

  return (
    <Pressable
      style={styles.card}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({ pathname: "/invoice/[id]", params: { id: invoice.id } });
      }}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.invoiceId}>{invoice.id}</Text>
          <Text style={styles.invoiceDesc}>{invoice.description}</Text>
          <Text style={styles.invoiceDate}>
            {new Date(invoice.date).toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" })}
          </Text>
        </View>
        <View>
          <Text style={styles.amount}>{invoice.currency} {invoice.amount.toLocaleString()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.itemsList}>
        {invoice.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemAmount}>{invoice.currency} {item.amount.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {invoice.status !== "paid" && (
        <Pressable style={styles.payBtn} onPress={handlePay}>
          <Feather name="credit-card" size={16} color="#fff" />
          <Text style={styles.payBtnText}>{t.payOnline}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const { invoices } = useAppContext();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("all");

  const filtered = filter === "all" ? invoices : invoices.filter((inv) => {
    if (filter === "unpaid") return inv.status !== "paid";
    return inv.status === "paid";
  });

  const totalUnpaid = invoices
    .filter((inv) => inv.status !== "paid")
    .reduce((s, inv) => s + inv.amount, 0);

  const filterLabels: Record<string, string> = {
    all: t.all,
    unpaid: t.unpaid,
    paid: t.paid,
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16 }]}>
        <Text style={styles.title}>{t.billing}</Text>
      </View>

      {totalUnpaid > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t.totalOutstanding}</Text>
          <Text style={styles.summaryAmount}>SAR {totalUnpaid.toLocaleString()}</Text>
          <Text style={styles.summaryNote}>{t.outstandingNote}</Text>
        </View>
      )}

      <View style={styles.filterRow}>
        {(["all", "unpaid", "paid"] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => {
              setFilter(f);
              Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {filterLabels[f]}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="credit-card" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>{t.noInvoices(filterLabels[filter])}</Text>
          </View>
        ) : (
          filtered.map((inv) => <InvoiceCard key={inv.id} invoice={inv} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.text },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
  },
  summaryLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 4 },
  summaryAmount: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#fff" },
  summaryNote: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 6 },
  filterRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 12,
    padding: 4,
  },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  filterBtnActive: { backgroundColor: Colors.backgroundCard, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  filterTextActive: { color: Colors.text, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 12 },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  invoiceId: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.textSecondary },
  invoiceDesc: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text, marginTop: 2 },
  invoiceDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  amount: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text, textAlign: "right" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 6, alignItems: "center" },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 12 },
  itemsList: { gap: 6 },
  itemRow: { flexDirection: "row", justifyContent: "space-between" },
  itemName: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, flex: 1 },
  itemAmount: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
  },
  payBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 16, color: Colors.textMuted },
});
