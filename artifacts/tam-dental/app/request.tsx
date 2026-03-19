import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "@/components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

export default function RequestScreen() {
  const insets = useSafeAreaInsets();
  const { patient } = useAppContext();
  const { t, language } = useLanguage();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const REQUEST_TYPES = [
    { id: "radiograph", label: t.reqRadiograph, icon: "radiobox-marked", description: t.reqRadiographDesc, color: Colors.info, bg: Colors.infoLight },
    { id: "sick_leave", label: t.reqSickLeave, icon: "file-medical-outline", description: t.reqSickLeaveDesc, color: Colors.success, bg: Colors.successLight },
    { id: "report", label: t.reqReport, icon: "file-chart-outline", description: t.reqReportDesc, color: Colors.primary, bg: "#EEF6FB" },
    { id: "referral", label: t.reqReferral, icon: "email-send-outline", description: t.reqReferralDesc, color: Colors.primary, bg: Colors.backgroundMuted },
    { id: "treatment_plan", label: t.reqTreatmentPlan, icon: "clipboard-list-outline", description: t.reqTreatmentPlanDesc, color: Colors.warning, bg: Colors.warningLight },
    { id: "other", label: t.reqOther, icon: "dots-horizontal-circle-outline", description: t.reqOtherDesc, color: Colors.textSecondary, bg: Colors.backgroundMuted },
  ];

  const selectedTypeObj = REQUEST_TYPES.find((tp) => tp.id === selectedType);

  const handleSubmit = () => {
    if (!selectedType) {
      Alert.alert(t.selectRequestType, t.selectRequestTypeMsg);
      return;
    }
    if (details.trim().length < 5) {
      Alert.alert(t.moreDetails, t.moreDetailsMsg);
      return;
    }

    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        t.requestSubmitted,
        t.requestSubmittedMsg(selectedTypeObj?.label ?? "", patient.phone),
        [{ text: t.ok, onPress: () => router.back() }]
      );
    }, 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 12 }]}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.submitRequest}</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>{t.requestIntro}</Text>

        <Text style={styles.sectionLabel}>{t.requestType}</Text>
        <View style={styles.typesGrid}>
          {REQUEST_TYPES.map((type) => (
            <Pressable
              key={type.id}
              style={[
                styles.typeCard,
                selectedType === type.id && { borderColor: type.color, backgroundColor: type.bg },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedType(type.id);
              }}
            >
              <View style={[styles.typeIconWrap, { backgroundColor: type.bg }]}>
                <MaterialCommunityIcons name={type.icon as any} size={22} color={type.color} />
              </View>
              <Text style={[styles.typeLabel, selectedType === type.id && { color: type.color }]}>
                {type.label}
              </Text>
              <Text style={styles.typeDesc}>{type.description}</Text>
              {selectedType === type.id && (
                <View style={[styles.selectedCheck, { backgroundColor: type.color }]}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t.requestDetails}</Text>
        <TextInput
          style={styles.textArea}
          placeholder={t.requestDetailsPlaceholder}
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
          value={details}
          onChangeText={setDetails}
          textAlignVertical="top"
          textAlign={language === "ar" ? "right" : "left"}
        />

        <Text style={styles.sectionLabel}>{t.purposeLabel}</Text>
        <TextInput
          style={[styles.textArea, { minHeight: 60 }]}
          placeholder={t.purposePlaceholder}
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={2}
          value={purpose}
          onChangeText={setPurpose}
          textAlignVertical="top"
          textAlign={language === "ar" ? "right" : "left"}
        />

        <View style={styles.patientInfo}>
          <Feather name="user" size={16} color={Colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.patientInfoTitle}>{t.submittingAs}</Text>
            <Text style={styles.patientInfoText}>
              {language === "ar" ? patient.nameAr : patient.name} · {patient.recordNumber}
            </Text>
            <Text style={styles.patientInfoText}>{patient.phone}</Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Feather name="clock" size={14} color={Colors.textSecondary} />
          <Text style={styles.noteText}>{t.processingTime}</Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 10 }]}>
        <Pressable
          style={[styles.submitBtn, (!selectedType || details.length < 5 || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!selectedType || details.length < 5 || submitting}
        >
          <Feather name="send" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>{submitting ? t.submitting : t.submitRequestBtn}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Colors.background,
  },
  closeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  scroll: { flex: 1 },
  content: { padding: 20 },
  intro: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text, marginBottom: 10 },
  typesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  typeCard: {
    width: "47%",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: "transparent",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    position: "relative",
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  typeLabel: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text, marginBottom: 4 },
  typeDesc: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  selectedCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    minHeight: 100,
    marginBottom: 16,
  },
  patientInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  patientInfoTitle: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  patientInfoText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 10,
    padding: 12,
  },
  noteText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  bottomBar: {
    padding: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
  },
  submitBtnDisabled: { backgroundColor: Colors.textMuted },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
