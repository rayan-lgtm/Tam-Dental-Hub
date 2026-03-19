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
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useLanguage } from "@/context/LanguageContext";

const DOCTORS = [
  { id: "D1", name: "Dr. Sarah Al-Farsi", specialty: "Orthodontist", available: true },
  { id: "D2", name: "Dr. Khalid Mansour", specialty: "General Dentist", available: true },
  { id: "D3", name: "Dr. Nora Al-Zahrani", specialty: "Periodontist", available: true },
  { id: "D4", name: "Dr. Omar Al-Ghamdi", specialty: "Endodontist", available: false },
  { id: "D5", name: "Dr. Lina Al-Harbi", specialty: "Cosmetic Dentist", available: true },
];

const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM",
];

const REASONS_EN = [
  "Routine Checkup", "Teeth Cleaning", "Toothache", "Orthodontic Visit",
  "Whitening Consultation", "Implant Consultation", "Cavity Treatment",
  "Emergency", "Follow-up", "Other",
];

const REASONS_AR = [
  "فحص دوري", "تنظيف الأسنان", "ألم الأسنان", "زيارة تقويم",
  "استشارة تبييض", "استشارة زرع", "علاج تسوس",
  "طارئ", "متابعة", "أخرى",
];

export default function BookAppointmentScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const doctor = DOCTORS.find((d) => d.id === selectedDoctor);
  const REASONS = language === "ar" ? REASONS_AR : REASONS_EN;
  const locale = language === "ar" ? "ar-SA" : "en-US";

  const getNextDays = (n: number) => {
    const days: { key: string; label: string; dayShort: string; dayNum: string }[] = [];
    const today = new Date();
    for (let i = 1; i <= n; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = d.toISOString().split("T")[0];
      days.push({
        key,
        label: d.toLocaleDateString(locale, { weekday: "short" }),
        dayShort: d.toLocaleDateString(locale, { month: "short" }),
        dayNum: d.getDate().toString(),
      });
    }
    return days;
  };

  const days = getNextDays(14);

  const handleBook = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !selectedReason) {
      Alert.alert(t.missingInfo, t.missingInfoMsg);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      t.bookingSuccess,
      t.bookingSuccessMsg(doctor?.name ?? "", selectedDate, selectedTime),
      [{ text: t.ok, onPress: () => router.back() }]
    );
  };

  const stepLabels = [t.selectDoctor, t.selectDateTime, t.reasonAndNotes];

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="x" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.bookAppointmentTitle}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.stepsRow}>
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <View style={[styles.step, step >= s && styles.stepActive]}>
              <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
            </View>
            {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>{t.selectDoctor}</Text>
            {DOCTORS.map((d) => (
              <Pressable
                key={d.id}
                style={[
                  styles.doctorOption,
                  selectedDoctor === d.id && styles.doctorOptionSelected,
                  !d.available && styles.doctorOptionDisabled,
                ]}
                onPress={() => {
                  if (!d.available) return;
                  Haptics.selectionAsync();
                  setSelectedDoctor(d.id);
                }}
              >
                <View style={styles.docAvatarSmall}>
                  <Text style={styles.docAvatarSmallText}>{d.name.split(" ")[1]?.[0] ?? "D"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.docName, !d.available && { color: Colors.textMuted }]}>{d.name}</Text>
                  <Text style={styles.docSpec}>{d.specialty}</Text>
                  {!d.available && <Text style={styles.unavailableText}>{t.notAvailable}</Text>}
                </View>
                {selectedDoctor === d.id && (
                  <Feather name="check-circle" size={22} color={Colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>{t.selectDateTime}</Text>
            <Text style={styles.subLabel}>{t.dateLabel}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
              <View style={styles.daysRow}>
                {days.map((day) => (
                  <Pressable
                    key={day.key}
                    style={[styles.dayBtn, selectedDate === day.key && styles.dayBtnActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedDate(day.key);
                      setSelectedTime(null);
                    }}
                  >
                    <Text style={[styles.dayName, selectedDate === day.key && styles.dayTextActive]}>{day.label}</Text>
                    <Text style={[styles.dayNum, selectedDate === day.key && styles.dayTextActive]}>{day.dayNum}</Text>
                    <Text style={[styles.dayMonth, selectedDate === day.key && styles.dayTextActive]}>{day.dayShort}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {selectedDate && (
              <>
                <Text style={[styles.subLabel, { marginTop: 20 }]}>{t.availableTimes}</Text>
                <View style={styles.timesGrid}>
                  {TIME_SLOTS.map((slot) => (
                    <Pressable
                      key={slot}
                      style={[styles.timeBtn, selectedTime === slot && styles.timeBtnActive]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedTime(slot);
                      }}
                    >
                      <Text style={[styles.timeText, selectedTime === slot && styles.timeTextActive]}>{slot}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>{t.reasonAndNotes}</Text>
            <Text style={styles.subLabel}>{t.reasonForVisit}</Text>
            <View style={styles.reasonsGrid}>
              {REASONS.map((r) => (
                <Pressable
                  key={r}
                  style={[styles.reasonBtn, selectedReason === r && styles.reasonBtnActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedReason(r);
                  }}
                >
                  <Text style={[styles.reasonText, selectedReason === r && styles.reasonTextActive]}>{r}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.subLabel, { marginTop: 20 }]}>{t.additionalNotes}</Text>
            <TextInput
              style={styles.notesInput}
              placeholder={t.additionalNotesPlaceholder}
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
              textAlign={language === "ar" ? "right" : "left"}
            />

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{t.appointmentSummary}</Text>
              <View style={styles.summaryRow}>
                <Feather name="user" size={14} color={Colors.textSecondary} />
                <Text style={styles.summaryText}>{doctor?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Feather name="calendar" size={14} color={Colors.textSecondary} />
                <Text style={styles.summaryText}>{selectedDate} · {selectedTime}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Feather name="clipboard" size={14} color={Colors.textSecondary} />
                <Text style={styles.summaryText}>{selectedReason}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 10 }]}>
        {step > 1 && (
          <Pressable style={styles.backBtnSecondary} onPress={() => setStep(step - 1)}>
            <Feather name={language === "ar" ? "arrow-right" : "arrow-left"} size={18} color={Colors.primary} />
            <Text style={styles.backBtnText}>{t.back}</Text>
          </Pressable>
        )}
        <Pressable
          style={[
            styles.nextBtn,
            (step === 1 && !selectedDoctor) ||
            (step === 2 && (!selectedDate || !selectedTime)) ||
            (step === 3 && !selectedReason)
              ? styles.nextBtnDisabled
              : null,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (step < 3) setStep(step + 1);
            else handleBook();
          }}
          disabled={
            (step === 1 && !selectedDoctor) ||
            (step === 2 && (!selectedDate || !selectedTime)) ||
            (step === 3 && !selectedReason)
          }
        >
          <Text style={styles.nextBtnText}>{step === 3 ? t.confirmBooking : t.next}</Text>
          <Feather name={step === 3 ? "check" : (language === "ar" ? "arrow-left" : "arrow-right")} size={18} color="#fff" />
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
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 16,
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepNum: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.textSecondary },
  stepNumActive: { color: "#fff" },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border },
  stepLineActive: { backgroundColor: Colors.primary },
  scroll: { flex: 1 },
  content: { padding: 20 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.text, marginBottom: 16 },
  subLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.textSecondary, marginBottom: 10 },
  doctorOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 2,
    borderColor: "transparent",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  doctorOptionSelected: { borderColor: Colors.primary, backgroundColor: "#EEF6FB" },
  doctorOptionDisabled: { opacity: 0.5 },
  docAvatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  docAvatarSmallText: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#fff" },
  docName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  docSpec: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  unavailableText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.danger, marginTop: 2 },
  daysScroll: { marginHorizontal: -20, paddingLeft: 20 },
  daysRow: { flexDirection: "row", gap: 10, paddingRight: 20 },
  dayBtn: {
    width: 64,
    height: 80,
    borderRadius: 14,
    backgroundColor: Colors.backgroundCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    gap: 2,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  dayBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayName: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary },
  dayNum: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text },
  dayMonth: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted },
  dayTextActive: { color: "#fff" },
  timesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  timeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.text },
  timeTextActive: { color: "#fff" },
  reasonsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  reasonBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Colors.backgroundMuted,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  reasonBtnActive: { backgroundColor: "#EEF6FB", borderColor: Colors.primary },
  reasonText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  reasonTextActive: { color: Colors.primary, fontFamily: "Inter_600SemiBold" },
  notesInput: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    minHeight: 100,
  },
  summaryCard: {
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    gap: 8,
  },
  summaryTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text, marginBottom: 4 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textSecondary },
  bottomBar: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  backBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  backBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.primary },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  nextBtnDisabled: { backgroundColor: Colors.textMuted },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
