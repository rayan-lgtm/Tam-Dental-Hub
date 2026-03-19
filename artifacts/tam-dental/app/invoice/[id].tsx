import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
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
import { useAppContext } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { invoices, payInvoice } = useAppContext();
  const { t, language } = useLanguage();
  const invoice = invoices.find((inv) => inv.id === id);

  if (!invoice) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>{t.error}</Text>
      </View>
    );
  }

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
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.billing}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Invoice Hero */}
        <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={[styles.heroBadgeText, { color: statusConfig.color, backgroundColor: statusConfig.bg }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={styles.heroId}>{invoice.id}</Text>
          <Text style={styles.heroDesc}>{invoice.description}</Text>
          <Text style={styles.heroAmount}>{invoice.currency} {invoice.amount.toLocaleString()}</Text>
          <Text style={styles.heroDate}>
            {new Date(invoice.date).toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" })}
          </Text>
        </LinearGradient>

        {/* Line Items */}
        <View style={styles.itemsCard}>
          <Text style={styles.cardTitle}>{t.services}</Text>
          <View style={styles.divider} />
          {invoice.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemAmount}>{invoice.currency} {item.amount.toLocaleString()}</Text>
            </View>
          ))}
          <View style={[styles.divider, { marginTop: 8 }]} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.total}</Text>
            <Text style={styles.totalAmount}>{invoice.currency} {invoice.amount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.infoCard}>
          <Feather name="info" size={16} color={Colors.info} />
          <Text style={styles.infoText}>
            {invoice.status === "paid" ? t.invoicePaidNote : t.invoiceUnpaidNote}
          </Text>
        </View>

        {invoice.status !== "paid" && (
          <Pressable style={styles.payBtn} onPress={handlePay}>
            <Feather name="credit-card" size={18} color="#fff" />
            <Text style={styles.payBtnText}>{t.payOnline} · {invoice.currency} {invoice.amount.toLocaleString()}</Text>
          </Pressable>
        )}

        {invoice.status === "paid" && (
          <View style={styles.paidConfirmation}>
            <Feather name="check-circle" size={22} color={Colors.success} />
            <Text style={styles.paidText}>{t.paymentComplete}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  notFound: { fontFamily: "Inter_500Medium", fontSize: 16, color: Colors.textSecondary, textAlign: "center", marginTop: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  content: { padding: 20, gap: 14 },
  heroCard: {
    borderRadius: 20,
    padding: 24,
  },
  heroBadge: { marginBottom: 12 },
  heroBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  heroId: { fontFamily: "Inter_500Medium", fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  heroDesc: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#fff", marginBottom: 12 },
  heroAmount: { fontFamily: "Inter_700Bold", fontSize: 32, color: "#fff" },
  heroDate: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 6 },
  itemsCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 12 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  itemName: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, flex: 1 },
  itemAmount: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text },
  totalAmount: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.primary },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.infoLight,
    borderRadius: 12,
    padding: 14,
  },
  infoText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.info, lineHeight: 19 },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  payBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  paidConfirmation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    paddingVertical: 16,
  },
  paidText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.success },
});
