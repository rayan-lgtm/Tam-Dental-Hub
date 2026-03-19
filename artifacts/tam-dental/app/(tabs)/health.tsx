import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

function PrescriptionCard({ rx }: { rx: ReturnType<typeof useAppContext>["prescriptions"][0] }) {
  const { t, language } = useLanguage();
  const locale = language === "ar" ? "ar-SA" : "en-US";
  return (
    <Pressable
      style={styles.card}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({ pathname: "/prescription/[id]", params: { id: rx.id } });
      }}
    >
      <View style={styles.cardRow}>
        <View style={styles.rxIcon}>
          <MaterialCommunityIcons name="prescription" size={24} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{rx.id}</Text>
          <Text style={styles.cardSub}>{t.prescribedBy} {rx.doctorName}</Text>
          <Text style={styles.cardDate}>
            {new Date(rx.date).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}
          </Text>
        </View>
        <View style={styles.medCount}>
          <Text style={styles.medCountNum}>{rx.medications.length}</Text>
          <Text style={styles.medCountLabel}>{t.medications.slice(0, 4)}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

function QuestionnaireCard({ q }: { q: ReturnType<typeof useAppContext>["questionnaires"][0] }) {
  const { t, language } = useLanguage();
  const locale = language === "ar" ? "ar-SA" : "en-US";

  const typeConfig = {
    medical_history: { icon: "clipboard-pulse-outline", label: "Medical History", color: Colors.primary },
    consent: { icon: "file-sign", label: "Consent Form", color: Colors.warning },
    satisfaction: { icon: "star-outline", label: "Satisfaction Survey", color: Colors.accent },
  } as const;

  const config = typeConfig[q.type];

  return (
    <Pressable
      style={styles.card}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({ pathname: "/questionnaire/[id]", params: { id: q.id } });
      }}
    >
      <View style={styles.cardRow}>
        <View style={[styles.qIcon, { backgroundColor: config.color + "20" }]}>
          <MaterialCommunityIcons name={config.icon as any} size={22} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{q.title}</Text>
          <Text style={styles.cardSub}>{config.label}</Text>
          <Text style={styles.cardDate}>
            {new Date(q.dueDate).toLocaleDateString(locale, { month: "short", day: "numeric" })}
          </Text>
        </View>
        <View style={[styles.statusPill, q.status === "completed" ? styles.statusDone : styles.statusPending]}>
          <Text style={[styles.statusText, { color: q.status === "completed" ? Colors.success : Colors.warning }]}>
            {q.status === "completed" ? t.done : t.loading.slice(0, 7)}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  const { prescriptions, questionnaires } = useAppContext();
  const { t } = useLanguage();
  const pendingForms = questionnaires.filter((q) => q.status === "pending");

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16 }]}>
        <Text style={styles.title}>{t.healthRecords}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {pendingForms.length > 0 && (
          <View style={styles.alertBox}>
            <Feather name="alert-circle" size={18} color={Colors.warning} />
            <Text style={styles.alertText}>{t.pendingFormsAlert(pendingForms.length)}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t.prescriptions}</Text>
        {prescriptions.length === 0 ? (
          <View style={styles.emptySection}>
            <Feather name="file-minus" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>{t.noPrescriptions}</Text>
          </View>
        ) : (
          prescriptions.map((rx) => <PrescriptionCard key={rx.id} rx={rx} />)
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{t.formsConsents}</Text>
        {questionnaires.map((q) => <QuestionnaireCard key={q.id} q={q} />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.text },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  alertBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  alertText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.warning, lineHeight: 20 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text, marginBottom: 12 },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rxIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EEF6FB",
    alignItems: "center",
    justifyContent: "center",
  },
  qIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  cardSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  cardDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  medCount: { alignItems: "center", marginRight: 4 },
  medCountNum: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.primary },
  medCountLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.textSecondary },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 4 },
  statusDone: { backgroundColor: Colors.successLight },
  statusPending: { backgroundColor: Colors.warningLight },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  emptySection: { alignItems: "center", gap: 8, paddingVertical: 24 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textMuted },
});
