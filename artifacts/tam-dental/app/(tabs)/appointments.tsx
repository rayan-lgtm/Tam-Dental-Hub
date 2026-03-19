import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
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
import { useAppContext, type Appointment } from "@/context/AppContext";

const CLINIC_LAT = 24.7136;
const CLINIC_LNG = 46.6753;
const CHECKIN_RADIUS_KM = 0.5;

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const config = {
    upcoming: { color: Colors.primary, bg: "#EEF6FB", label: "Upcoming" },
    completed: { color: Colors.success, bg: Colors.successLight, label: "Completed" },
    cancelled: { color: Colors.danger, bg: Colors.dangerLight, label: "Cancelled" },
  }[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function AppointmentCard({ apt }: { apt: Appointment }) {
  const { checkinAppointment, cancelAppointment } = useAppContext();
  const [checkingIn, setCheckingIn] = useState(false);

  const formattedDate = new Date(apt.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const hoursUntil = (new Date(apt.date).getTime() - Date.now()) / 3600000;
  const canCancel = hoursUntil > 24 && apt.status === "upcoming";

  const handleCheckin = async () => {
    setCheckingIn(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location Required", "Please enable location to check in.");
        setCheckingIn(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const dist = getDistanceKm(loc.coords.latitude, loc.coords.longitude, CLINIC_LAT, CLINIC_LNG);

      if (dist <= CHECKIN_RADIUS_KM) {
        checkinAppointment(apt.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Checked In!", "You have successfully checked in. Please proceed to reception.");
      } else {
        Alert.alert(
          "Too Far Away",
          `You must be within ${CHECKIN_RADIUS_KM * 1000}m of the clinic to check in. You are currently ${(dist * 1000).toFixed(0)}m away.`
        );
      }
    } catch {
      Alert.alert("Error", "Unable to get your location. Please try again.");
    }
    setCheckingIn(false);
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Appointment",
      `Are you sure you want to cancel your appointment with ${apt.doctorName} on ${formattedDate}?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Appointment",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            cancelAppointment(apt.id);
          },
        },
      ]
    );
  };

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: "/appointment/[id]", params: { id: apt.id } })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.doctorInfo}>
          <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.doctorAvatar}>
            <Text style={styles.doctorInitial}>
              {apt.doctorName.split(" ").find((w) => w.startsWith("Dr"))
                ? apt.doctorName.split(" ")[1]?.[0] ?? "D"
                : apt.doctorName[0]}
            </Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.doctorName}>{apt.doctorName}</Text>
            <Text style={styles.specialty}>{apt.doctorSpecialty}</Text>
          </View>
        </View>
        <StatusBadge status={apt.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Feather name="calendar" size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{formattedDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="clock" size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{apt.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{apt.location}</Text>
        </View>
      </View>

      {apt.status === "upcoming" && !apt.checkedIn && (
        <View style={styles.cardActions}>
          <Pressable
            style={styles.checkinBtn}
            onPress={handleCheckin}
            disabled={checkingIn}
          >
            <Feather name="map-pin" size={15} color="#fff" />
            <Text style={styles.checkinBtnText}>
              {checkingIn ? "Locating..." : "Check In"}
            </Text>
          </Pressable>
          {canCancel && (
            <Pressable style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      )}
      {apt.checkedIn && (
        <View style={styles.checkedInBadge}>
          <Feather name="check-circle" size={14} color={Colors.success} />
          <Text style={styles.checkedInText}>Checked In</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const { appointments } = useAppContext();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const upcoming = appointments.filter((a) => a.status === "upcoming");
  const past = appointments.filter((a) => a.status !== "upcoming");
  const shown = tab === "upcoming" ? upcoming : past;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16 }]}>
        <Text style={styles.title}>Appointments</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/book-appointment");
          }}
        >
          <Feather name="plus" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      <View style={styles.tabBar}>
        {(["upcoming", "past"] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => {
              setTab(t);
              Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "upcoming" ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
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
        {shown.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No {tab} appointments</Text>
            {tab === "upcoming" && (
              <Pressable
                style={styles.bookBtn}
                onPress={() => router.push("/book-appointment")}
              >
                <Text style={styles.bookBtnText}>Book an Appointment</Text>
              </Pressable>
            )}
          </View>
        ) : (
          shown.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.text },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF6FB",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: Colors.backgroundCard, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  tabTextActive: { color: Colors.text, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 12 },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  doctorInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  doctorInitial: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#fff" },
  doctorName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  specialty: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 12 },
  cardDetails: { gap: 7 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, flex: 1 },
  cardActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  checkinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
  },
  checkinBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.danger },
  checkedInBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  checkedInText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.success },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: "Inter_500Medium", fontSize: 16, color: Colors.textMuted },
  bookBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  bookBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
});
