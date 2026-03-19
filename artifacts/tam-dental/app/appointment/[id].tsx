import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

const CLINIC_LAT = 24.7136;
const CLINIC_LNG = 46.6753;
const CHECKIN_RADIUS_KM = 0.5;

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { appointments, checkinAppointment, cancelAppointment, confirmAppointment } = useAppContext();
  const { t, language } = useLanguage();
  const apt = appointments.find((a) => a.id === id);
  const [checkingIn, setCheckingIn] = useState(false);

  if (!apt) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.notFound}>{t.error}</Text>
      </View>
    );
  }

  const locale = language === "ar" ? "ar-SA" : "en-US";
  const formattedDate = new Date(apt.date).toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const hoursUntil = (new Date(apt.date).getTime() - Date.now()) / 3600000;
  const canCancel = hoursUntil > 24 && apt.status === "upcoming";
  const canConfirm = apt.status === "upcoming" && hoursUntil <= 48 && hoursUntil > 0;

  const handleCheckin = async () => {
    setCheckingIn(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t.locationRequired, t.locationRequiredMsg);
        setCheckingIn(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const dist = getDistanceKm(loc.coords.latitude, loc.coords.longitude, CLINIC_LAT, CLINIC_LNG);

      if (dist <= CHECKIN_RADIUS_KM) {
        checkinAppointment(apt.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t.checkinSuccess, t.checkinSuccessMsg);
      } else {
        Alert.alert(
          t.checkinTooFar,
          t.checkinTooFarMsg(CHECKIN_RADIUS_KM * 1000, Math.round(dist * 1000))
        );
      }
    } catch {
      Alert.alert(t.error, t.locationRequiredMsg);
    }
    setCheckingIn(false);
  };

  const handleCancel = () => {
    Alert.alert(
      t.cancelConfirmTitle,
      t.cancelConfirmMsg(apt.doctorName, formattedDate),
      [
        { text: t.keepAppointment, style: "cancel" },
        {
          text: t.cancelAppointment,
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            cancelAppointment(apt.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    confirmAppointment(apt.id);
    Alert.alert(t.confirmSuccess, t.confirmSuccessMsg);
  };

  const statusConfig = {
    upcoming: { color: Colors.primary, bg: "#EEF6FB", label: t.aptStatus_upcoming },
    completed: { color: Colors.success, bg: Colors.successLight, label: t.aptStatus_completed },
    cancelled: { color: Colors.danger, bg: Colors.dangerLight, label: t.aptStatus_cancelled },
  }[apt.status];

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8 }]}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{t.appointments}</Text>
        <View style={styles.backBtn} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Card */}
        <View style={styles.doctorCard}>
          <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.docAvatar}>
            <Text style={styles.docAvatarText}>
              {apt.doctorName.split(" ").slice(1, 2)[0]?.[0] ?? "D"}
            </Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.docName}>{apt.doctorName}</Text>
            <Text style={styles.docSpec}>{apt.doctorSpecialty}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          {[
            { icon: "calendar", label: t.date, value: formattedDate },
            { icon: "clock", label: t.time, value: apt.time },
            { icon: "map-pin", label: t.location, value: apt.location },
            { icon: "hash", label: t.reference, value: apt.id },
          ].map((item) => (
            <View key={item.label} style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Feather name={item.icon as any} size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            </View>
          ))}
          {apt.notes && (
            <View style={[styles.detailRow, styles.notesRow]}>
              <View style={styles.detailIcon}>
                <Feather name="file-text" size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{t.notes}</Text>
                <Text style={styles.detailValue}>{apt.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Check-in info */}
        {apt.status === "upcoming" && !apt.checkedIn && (
          <View style={styles.infoBox}>
            <Feather name="info" size={16} color={Colors.info} />
            <Text style={styles.infoText}>{t.checkinInfo}</Text>
          </View>
        )}

        {apt.checkedIn && (
          <View style={styles.checkedInBox}>
            <Feather name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.checkedInText}>{t.checkinSuccessMsg}</Text>
          </View>
        )}

        {apt.status === "upcoming" && (
          <View style={styles.actionsContainer}>
            {!apt.checkedIn && (
              <Pressable style={styles.primaryBtn} onPress={handleCheckin} disabled={checkingIn}>
                <Feather name="map-pin" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>{checkingIn ? t.checkingInText : t.checkInBtn}</Text>
              </Pressable>
            )}
            {canConfirm && (
              <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
                <Feather name="check" size={18} color={Colors.success} />
                <Text style={styles.confirmBtnText}>{t.confirmAppointment}</Text>
              </Pressable>
            )}
            {canCancel && (
              <Pressable style={styles.cancelBtn} onPress={handleCancel}>
                <Feather name="x" size={18} color={Colors.danger} />
                <Text style={styles.cancelBtnText}>{t.cancelAppointment}</Text>
              </Pressable>
            )}
            {!canCancel && apt.status === "upcoming" && (
              <View style={styles.noCancelNote}>
                <Feather name="lock" size={13} color={Colors.textMuted} />
                <Text style={styles.noCancelText}>{t.cancelRestriction}</Text>
              </View>
            )}
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
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#fff" },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 14 },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  docAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  docAvatarText: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" },
  docName: { fontFamily: "Inter_700Bold", fontSize: 17, color: Colors.text },
  docSpec: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  detailsCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    gap: 0,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  notesRow: { borderBottomWidth: 0 },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF6FB",
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textMuted, marginBottom: 3 },
  detailValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.infoLight,
    borderRadius: 12,
    padding: 14,
  },
  infoText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.info, lineHeight: 19 },
  checkedInBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 14,
  },
  checkedInText: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.success },
  actionsContainer: { gap: 10 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
  },
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  confirmBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.success },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 2,
    borderColor: Colors.danger,
  },
  cancelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.danger },
  noCancelNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  noCancelText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
});
