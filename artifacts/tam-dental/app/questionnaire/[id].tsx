import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { Text } from "@/components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";

type Question = { id: string; text: string; type: "boolean" | "choice"; options?: string[] };

const QUESTIONNAIRES_DATA: Record<string, { title: string; questions: Question[] }> = {
  "Q-001": {
    title: "Medical History Update",
    questions: [
      { id: "q1", text: "Do you have any allergies to medications or materials?", type: "boolean" },
      { id: "q2", text: "Are you currently taking any medications?", type: "boolean" },
      { id: "q3", text: "Do you have a history of heart disease?", type: "boolean" },
      { id: "q4", text: "Do you have diabetes?", type: "boolean" },
      { id: "q5", text: "Are you pregnant or breastfeeding?", type: "boolean" },
      { id: "q6", text: "Do you smoke or use tobacco products?", type: "boolean" },
      { id: "q7", text: "How often do you brush your teeth?", type: "choice", options: ["Once a day", "Twice a day", "After every meal", "Irregularly"] },
      { id: "q8", text: "When did you last visit a dentist?", type: "choice", options: ["Less than 6 months", "6–12 months", "1–2 years", "More than 2 years"] },
    ],
  },
  "Q-002": {
    title: "Treatment Consent Form",
    questions: [
      { id: "c1", text: "I consent to the examination and proposed dental treatment", type: "boolean" },
      { id: "c2", text: "I have been informed of the risks and alternatives to the treatment", type: "boolean" },
      { id: "c3", text: "I allow the clinic to contact me for follow-up and appointment reminders", type: "boolean" },
      { id: "c4", text: "I acknowledge that results may vary and no guarantee has been made", type: "boolean" },
      { id: "c5", text: "I consent to local anesthesia if required during treatment", type: "boolean" },
    ],
  },
  "Q-003": {
    title: "Patient Satisfaction Survey",
    questions: [
      { id: "s1", text: "How satisfied are you with your overall experience?", type: "choice", options: ["Very Satisfied", "Satisfied", "Neutral", "Unsatisfied"] },
      { id: "s2", text: "How would you rate the cleanliness of the clinic?", type: "choice", options: ["Excellent", "Good", "Fair", "Poor"] },
      { id: "s3", text: "How was the professionalism of the staff?", type: "choice", options: ["Excellent", "Good", "Fair", "Poor"] },
      { id: "s4", text: "Would you recommend TAM Dental to friends and family?", type: "boolean" },
    ],
  },
};

export default function QuestionnaireScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { questionnaires } = useAppContext();
  const { t, isRTL } = useLanguage();
  const form = QUESTIONNAIRES_DATA[id ?? ""];
  const q = questionnaires.find((q) => q.id === id);

  const [answers, setAnswers] = useState<Record<string, boolean | string>>({});
  const [submitted, setSubmitted] = useState(q?.status === "completed");

  if (!form || !q) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>{t.error}</Text>
      </View>
    );
  }

  const allAnswered = form.questions.every((qu) => answers[qu.id] !== undefined);

  const handleSubmit = () => {
    if (!allAnswered) {
      Alert.alert(t.incomplete, t.incompleteMsg);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
    Alert.alert(t.formSubmitted, t.formSubmittedMsg);
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{form.title}</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.doneState}>
          <View style={styles.doneIcon}>
            <Feather name="check-circle" size={48} color={Colors.success} />
          </View>
          <Text style={styles.doneTitle}>{t.formCompleted}</Text>
          <Text style={styles.doneText}>{t.formCompletedMsg(form.title)}</Text>
          <Pressable style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>{t.goBack}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{form.title}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${(Object.keys(answers).length / form.questions.length) * 100}%`,
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {t.progressAnswered(Object.keys(answers).length, form.questions.length)}
      </Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {form.questions.map((question, idx) => (
          <View key={question.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.qNum}>
                <Text style={styles.qNumText}>{idx + 1}</Text>
              </View>
              <Text style={styles.questionText}>{question.text}</Text>
            </View>

            {question.type === "boolean" && (
              <View style={styles.booleanRow}>
                {([t.yes, t.no] as const).map((opt) => (
                  <Pressable
                    key={opt}
                    style={[
                      styles.boolBtn,
                      answers[question.id] === (opt === t.yes) && styles.boolBtnActive,
                      opt === t.no && answers[question.id] === false && styles.boolBtnNo,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setAnswers((prev) => ({ ...prev, [question.id]: opt === t.yes }));
                    }}
                  >
                    <Feather
                      name={opt === t.yes ? "check" : "x"}
                      size={16}
                      color={
                        answers[question.id] === (opt === t.yes)
                          ? "#fff"
                          : answers[question.id] === false && opt === t.no
                          ? "#fff"
                          : Colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.boolBtnText,
                        (answers[question.id] === (opt === t.yes) ||
                          (answers[question.id] === false && opt === t.no)) && { color: "#fff" },
                      ]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {question.type === "choice" && (
              <View style={styles.choiceGroup}>
                {question.options?.map((opt) => (
                  <Pressable
                    key={opt}
                    style={[styles.choiceBtn, answers[question.id] === opt && styles.choiceBtnActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setAnswers((prev) => ({ ...prev, [question.id]: opt }));
                    }}
                  >
                    <View style={[styles.choiceRadio, answers[question.id] === opt && styles.choiceRadioActive]}>
                      {answers[question.id] === opt && <View style={styles.choiceRadioInner} />}
                    </View>
                    <Text style={[styles.choiceText, answers[question.id] === opt && styles.choiceTextActive]}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 10 }]}>
        <Pressable
          style={[styles.submitBtn, !allAnswered && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!allAnswered}
        >
          <Feather name="send" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>{t.submitForm}</Text>
        </Pressable>
      </View>
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
    paddingBottom: 8,
    backgroundColor: Colors.background,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text, flex: 1, textAlign: "center" },
  progressBar: { height: 4, backgroundColor: Colors.backgroundMuted, marginHorizontal: 20, borderRadius: 4, marginBottom: 6 },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 4 },
  progressText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, textAlign: "center", marginBottom: 12 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  questionCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  questionHeader: { flexDirection: "row", gap: 10, marginBottom: 14, alignItems: "flex-start" },
  qNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  qNumText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.primary },
  questionText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.text, flex: 1, lineHeight: 20 },
  booleanRow: { flexDirection: "row", gap: 10 },
  boolBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundMuted,
  },
  boolBtnActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  boolBtnNo: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  boolBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.textSecondary },
  choiceGroup: { gap: 8 },
  choiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  choiceBtnActive: { borderColor: Colors.primary, backgroundColor: "#EEF6FB" },
  choiceRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceRadioActive: { borderColor: Colors.primary },
  choiceRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  choiceText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textSecondary },
  choiceTextActive: { color: Colors.primary, fontFamily: "Inter_600SemiBold" },
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
  doneState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  doneIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.successLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  doneTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.text, marginBottom: 8 },
  doneText: { fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  doneBtn: { marginTop: 24, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
