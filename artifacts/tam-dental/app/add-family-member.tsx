import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/Text";
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

type NICRecord = {
  name: string;
  nameAr: string;
};

const NIC_DATABASE: Record<string, { dob: string } & NICRecord> = {
  "1098765432": { dob: "1990-05-15", name: "Fatima Al-Rashidi", nameAr: "فاطمة الراشدي" },
  "1087654321": { dob: "1985-11-20", name: "Mohammed Al-Qahtani", nameAr: "محمد القحطاني" },
  "1122334455": { dob: "2000-01-08", name: "Sara Al-Rashidi", nameAr: "سارة الراشدي" },
  "2098765431": { dob: "1995-07-22", name: "Omar Al-Ghamdi", nameAr: "عمر الغامدي" },
  "1011223344": { dob: "1978-12-30", name: "Khalid Al-Mutairi", nameAr: "خالد المطيري" },
  "2055667788": { dob: "2005-03-19", name: "Lina Al-Zahrani", nameAr: "لينا الزهراني" },
};

const RELATIONSHIPS = [
  { en: "Spouse", ar: "الزوج / الزوجة", icon: "heart" },
  { en: "Child", ar: "ابن / ابنة", icon: "baby-face-outline" },
  { en: "Parent", ar: "الأم / الأب", icon: "account-supervisor" },
  { en: "Sibling", ar: "الأخ / الأخت", icon: "account-multiple" },
  { en: "Other", ar: "أخرى", icon: "account" },
] as const;

async function lookupNIC(idNumber: string, dob: string): Promise<NICRecord> {
  await new Promise((r) => setTimeout(r, 2000));
  const record = NIC_DATABASE[idNumber];
  if (record && record.dob === dob) {
    return { name: record.name, nameAr: record.nameAr };
  }
  throw new Error("not_found");
}

type Step = "form" | "verifying" | "found" | "error";

export default function AddFamilyMemberScreen() {
  const insets = useSafeAreaInsets();
  const { addFamilyMember, familyMembers } = useAppContext();
  const { t, language, isRTL } = useLanguage();

  const [step, setStep] = useState<Step>("form");
  const [idNumber, setIdNumber] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);
  const [foundRecord, setFoundRecord] = useState<NICRecord | null>(null);

  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const dob = year && month && day
    ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    : "";

  const canVerify =
    idNumber.length === 10 &&
    day.length >= 1 && parseInt(day) >= 1 && parseInt(day) <= 31 &&
    month.length >= 1 && parseInt(month) >= 1 && parseInt(month) <= 12 &&
    year.length === 4;

  const handleVerify = async () => {
    if (!canVerify) return;

    const existing = familyMembers.find((m) => m.idNumber === idNumber);
    if (existing) {
      Alert.alert(t.alreadyAdded, t.alreadyAddedMsg);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("verifying");

    try {
      const record = await lookupNIC(idNumber, dob);
      setFoundRecord(record);
      setStep("found");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setStep("error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleConfirm = () => {
    if (!foundRecord || !selectedRelationship) {
      Alert.alert(t.selectRelationship, t.selectRelationshipMsg);
      return;
    }
    const rel = RELATIONSHIPS.find((r) => r.en === selectedRelationship);
    addFamilyMember({
      idNumber,
      name: foundRecord.name,
      nameAr: foundRecord.nameAr,
      relationship: rel?.en ?? selectedRelationship,
      relationshipAr: rel?.ar ?? selectedRelationship,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t.memberAdded, t.memberAddedMsg(language === "ar" ? foundRecord.nameAr : foundRecord.name), [
      { text: t.ok, onPress: () => router.back() },
    ]);
  };

  const handleReset = () => {
    setStep("form");
    setFoundRecord(null);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 12 }]}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.addFamilyMember}</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* NIC Badge */}
        <View style={styles.nicBadge}>
          <LinearGradient
            colors={[Colors.primaryDark, Colors.primary]}
            style={styles.nicGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="shield-check" size={28} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.nicTitle}>{t.nicTitle}</Text>
              <Text style={styles.nicSub}>{t.nicSubtitle}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Demo hint */}
        <View style={styles.demoHint}>
          <Feather name="info" size={13} color={Colors.info} />
          <Text style={styles.demoHintText}>{t.nicDemoHint}</Text>
        </View>

        {/* FORM STEP */}
        {(step === "form" || step === "verifying") && (
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>{t.nationalId}</Text>
            <View style={styles.inputWrap}>
              <Feather name="credit-card" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { textAlign: language === "ar" ? "right" : "left" }]}
                placeholder={t.nationalIdPlaceholder}
                placeholderTextColor={Colors.textMuted}
                value={idNumber}
                onChangeText={(v) => setIdNumber(v.replace(/\D/g, "").slice(0, 10))}
                keyboardType="numeric"
                maxLength={10}
                editable={step === "form"}
              />
              {idNumber.length === 10 && (
                <Feather name="check-circle" size={18} color={Colors.success} />
              )}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>{t.dateOfBirth}</Text>
            <View style={styles.dobRow}>
              <View style={styles.dobField}>
                <Text style={styles.dobLabel}>{t.day}</Text>
                <TextInput
                  style={[styles.dobInput, { textAlign: "center" }]}
                  placeholder="DD"
                  placeholderTextColor={Colors.textMuted}
                  value={day}
                  onChangeText={(v) => {
                    const cleaned = v.replace(/\D/g, "").slice(0, 2);
                    setDay(cleaned);
                    if (cleaned.length === 2) monthRef.current?.focus();
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  editable={step === "form"}
                />
              </View>
              <Text style={styles.dobSep}>/</Text>
              <View style={styles.dobField}>
                <Text style={styles.dobLabel}>{t.month}</Text>
                <TextInput
                  ref={monthRef}
                  style={[styles.dobInput, { textAlign: "center" }]}
                  placeholder="MM"
                  placeholderTextColor={Colors.textMuted}
                  value={month}
                  onChangeText={(v) => {
                    const cleaned = v.replace(/\D/g, "").slice(0, 2);
                    setMonth(cleaned);
                    if (cleaned.length === 2) yearRef.current?.focus();
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  editable={step === "form"}
                />
              </View>
              <Text style={styles.dobSep}>/</Text>
              <View style={[styles.dobField, { flex: 2 }]}>
                <Text style={styles.dobLabel}>{t.year}</Text>
                <TextInput
                  ref={yearRef}
                  style={[styles.dobInput, { textAlign: "center" }]}
                  placeholder="YYYY"
                  placeholderTextColor={Colors.textMuted}
                  value={year}
                  onChangeText={(v) => setYear(v.replace(/\D/g, "").slice(0, 4))}
                  keyboardType="numeric"
                  maxLength={4}
                  editable={step === "form"}
                />
              </View>
            </View>

            <Pressable
              style={[styles.verifyBtn, (!canVerify || step === "verifying") && styles.verifyBtnDisabled]}
              onPress={handleVerify}
              disabled={!canVerify || step === "verifying"}
            >
              {step === "verifying" ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.verifyBtnText}>{t.verifying}</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="shield-search" size={20} color="#fff" />
                  <Text style={styles.verifyBtnText}>{t.verifyIdentity}</Text>
                </>
              )}
            </Pressable>

            {step === "verifying" && (
              <View style={styles.verifyingNote}>
                <Text style={styles.verifyingNoteText}>{t.verifyingNote}</Text>
              </View>
            )}
          </View>
        )}

        {/* FOUND STEP */}
        {step === "found" && foundRecord && (
          <View>
            <View style={styles.foundCard}>
              <View style={styles.foundHeader}>
                <View style={styles.foundCheck}>
                  <Feather name="check" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foundVerifiedLabel}>{t.identityVerified}</Text>
                  <Text style={styles.foundNicSource}>{t.nicSource}</Text>
                </View>
              </View>
              <View style={styles.foundNameCard}>
                <Text style={styles.foundNameEn}>{foundRecord.name}</Text>
                <Text style={styles.foundNameAr}>{foundRecord.nameAr}</Text>
                <View style={styles.foundIdRow}>
                  <Feather name="credit-card" size={13} color={Colors.textMuted} />
                  <Text style={styles.foundIdText}>
                    ••••••{idNumber.slice(-4)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.fieldLabel}>{t.relationship}</Text>
            <View style={styles.relationGrid}>
              {RELATIONSHIPS.map((rel) => (
                <Pressable
                  key={rel.en}
                  style={[
                    styles.relBtn,
                    selectedRelationship === rel.en && styles.relBtnActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedRelationship(rel.en);
                  }}
                >
                  <MaterialCommunityIcons
                    name={rel.icon as any}
                    size={20}
                    color={selectedRelationship === rel.en ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.relLabel, selectedRelationship === rel.en && styles.relLabelActive]}>
                    {language === "ar" ? rel.ar : rel.en}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.actionRow}>
              <Pressable style={styles.retryBtn} onPress={handleReset}>
                <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={16} color={Colors.textSecondary} />
                <Text style={styles.retryBtnText}>{t.startOver}</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, !selectedRelationship && styles.confirmBtnDisabled]}
                onPress={handleConfirm}
                disabled={!selectedRelationship}
              >
                <Feather name="user-plus" size={18} color="#fff" />
                <Text style={styles.confirmBtnText}>{t.addMember}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ERROR STEP */}
        {step === "error" && (
          <View style={styles.errorCard}>
            <View style={styles.errorIconWrap}>
              <Feather name="alert-circle" size={36} color={Colors.danger} />
            </View>
            <Text style={styles.errorTitle}>{t.nicNotFound}</Text>
            <Text style={styles.errorBody}>{t.nicNotFoundMsg}</Text>
            <View style={styles.errorDetails}>
              <View style={styles.errorDetailRow}>
                <Feather name="hash" size={14} color={Colors.textSecondary} />
                <Text style={styles.errorDetailText}>{t.enteredId}: ••••••{idNumber.slice(-4)}</Text>
              </View>
              <View style={styles.errorDetailRow}>
                <Feather name="calendar" size={14} color={Colors.textSecondary} />
                <Text style={styles.errorDetailText}>{t.enteredDob}: {day}/{month}/{year}</Text>
              </View>
            </View>
            <Pressable style={styles.tryAgainBtn} onPress={handleReset}>
              <Feather name="refresh-cw" size={16} color="#fff" />
              <Text style={styles.tryAgainBtnText}>{t.tryAgain}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16 },
  nicBadge: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  nicGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
  },
  nicTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  nicSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  demoHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.infoLight,
    borderRadius: 10,
    padding: 12,
  },
  demoHintText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.info,
    lineHeight: 17,
  },
  formCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    gap: 4,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    gap: 10,
    height: 52,
  },
  inputIcon: { flexShrink: 0 },
  input: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.text,
    letterSpacing: 1.5,
  },
  dobRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  dobField: { flex: 1, alignItems: "center" },
  dobLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 5,
  },
  dobInput: {
    width: "100%",
    height: 52,
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.text,
  },
  dobSep: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.textMuted,
    paddingBottom: 10,
  },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 20,
  },
  verifyBtnDisabled: { backgroundColor: Colors.textMuted },
  verifyBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  verifyingNote: { alignItems: "center", marginTop: 12 },
  verifyingNoteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  foundCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    padding: 20,
    elevation: 2,
    shadowColor: Colors.success,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1.5,
    borderColor: Colors.success + "40",
    marginBottom: 20,
  },
  foundHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  foundCheck: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  foundVerifiedLabel: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.success },
  foundNicSource: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  foundNameCard: {
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  foundNameEn: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text, textAlign: "center" },
  foundNameAr: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text, textAlign: "center" },
  foundIdRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  foundIdText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary, letterSpacing: 2 },
  relationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  relBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
  },
  relBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EEF6FB",
  },
  relLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  relLabelActive: { color: Colors.primary, fontFamily: "Inter_600SemiBold" },
  actionRow: { flexDirection: "row", gap: 12 },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  retryBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.textSecondary },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  confirmBtnDisabled: { backgroundColor: Colors.textMuted },
  confirmBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  errorCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.dangerLight,
    elevation: 2,
    shadowColor: Colors.danger,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.danger, marginBottom: 8 },
  errorBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
  },
  errorDetails: {
    width: "100%",
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 20,
  },
  errorDetailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  errorDetailText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  tryAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  tryAgainBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});
