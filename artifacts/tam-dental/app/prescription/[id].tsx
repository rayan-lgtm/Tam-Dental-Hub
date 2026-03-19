import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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

export default function PrescriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { prescriptions } = useAppContext();
  const rx = prescriptions.find((p) => p.id === id);

  if (!rx) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Prescription not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Prescription</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Clinic Header */}
        <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.clinicCard}>
          <View style={styles.clinicTop}>
            <View>
              <Text style={styles.clinicName}>TAM Dental Clinic</Text>
              <Text style={styles.clinicSub}>Licensed Dental Practice • KSA</Text>
            </View>
            <MaterialCommunityIcons name="prescription" size={36} color="rgba(255,255,255,0.7)" />
          </View>
          <View style={styles.clinicMeta}>
            <Text style={styles.clinicMetaText}>Rx #{rx.id}</Text>
            <Text style={styles.clinicMetaText}>
              {new Date(rx.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </Text>
          </View>
        </LinearGradient>

        {/* Doctor Sign */}
        <View style={styles.doctorCard}>
          <View style={styles.docAvatar}>
            <Text style={styles.docAvatarText}>{rx.doctorSignature}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prescribedBy}>Prescribed by</Text>
            <Text style={styles.doctorName}>{rx.doctorName}</Text>
          </View>
          <View style={styles.signedBadge}>
            <Feather name="check-circle" size={14} color={Colors.success} />
            <Text style={styles.signedText}>Signed</Text>
          </View>
        </View>

        {/* Medications */}
        <Text style={styles.sectionTitle}>Medications</Text>
        {rx.medications.map((med, i) => (
          <View key={i} style={styles.medCard}>
            <View style={styles.medHeader}>
              <View style={styles.medNumBadge}>
                <Text style={styles.medNum}>{i + 1}</Text>
              </View>
              <Text style={styles.medName}>{med.name}</Text>
            </View>
            <View style={styles.medDetails}>
              <View style={styles.medDetail}>
                <Text style={styles.medDetailLabel}>Dosage</Text>
                <Text style={styles.medDetailValue}>{med.dosage}</Text>
              </View>
              <View style={styles.medDetail}>
                <Text style={styles.medDetailLabel}>Frequency</Text>
                <Text style={styles.medDetailValue}>{med.frequency}</Text>
              </View>
              <View style={styles.medDetail}>
                <Text style={styles.medDetailLabel}>Duration</Text>
                <Text style={styles.medDetailValue}>{med.duration}</Text>
              </View>
            </View>
          </View>
        ))}

        {rx.notes && (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <Feather name="file-text" size={16} color={Colors.primary} />
              <Text style={styles.notesTitle}>Doctor's Notes</Text>
            </View>
            <Text style={styles.notesText}>{rx.notes}</Text>
          </View>
        )}

        <View style={styles.warningCard}>
          <Feather name="alert-triangle" size={16} color={Colors.warning} />
          <Text style={styles.warningText}>
            This prescription is valid as issued. Do not share or reuse. Contact the clinic if you have any concerns.
          </Text>
        </View>
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
  clinicCard: {
    borderRadius: 18,
    padding: 20,
  },
  clinicTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  clinicName: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#fff" },
  clinicSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  clinicMeta: { flexDirection: "row", justifyContent: "space-between" },
  clinicMetaText: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.75)" },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  docAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  docAvatarText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  prescribedBy: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  doctorName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text, marginTop: 2 },
  signedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  signedText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.success },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: Colors.text, marginBottom: 4 },
  medCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  medHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  medNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  medNum: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  medName: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text, flex: 1 },
  medDetails: { flexDirection: "row", gap: 0 },
  medDetail: { flex: 1 },
  medDetailLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted, marginBottom: 3 },
  medDetailValue: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  notesCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  notesHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  notesTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text },
  notesText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    padding: 14,
  },
  warningText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.warning, lineHeight: 18 },
});
