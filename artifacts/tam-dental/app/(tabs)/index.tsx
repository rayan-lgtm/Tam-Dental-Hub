import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Linking,
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

const WHATSAPP_NUMBER = "966XXXXXXXXX";
const CLINIC_PHONE = "+966XXXXXXXXX";

function QuickAction({
  icon,
  label,
  onPress,
  color = Colors.primary,
  bg = Colors.backgroundMuted,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color?: string;
  bg?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.quickActionWrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={[styles.quickActionIcon, { backgroundColor: bg }]}>{icon}</View>
        <Text style={styles.quickActionLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function UpcomingAppointmentCard() {
  const { appointments } = useAppContext();
  const next = appointments.find(
    (a) => a.status === "upcoming" && !a.checkedIn
  );

  if (!next) return null;

  const formattedDate = new Date(next.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <Pressable
      style={styles.aptCard}
      onPress={() => router.push({ pathname: "/appointment/[id]", params: { id: next.id } })}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.aptGradient}
      >
        <View style={styles.aptRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.aptLabel}>Next Appointment</Text>
            <Text style={styles.aptDoctor}>{next.doctorName}</Text>
            <Text style={styles.aptSpecialty}>{next.doctorSpecialty}</Text>
            <View style={styles.aptDateRow}>
              <Feather name="calendar" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.aptDate}>{formattedDate} · {next.time}</Text>
            </View>
          </View>
          <View style={styles.aptActions}>
            <Pressable
              style={styles.aptChip}
              onPress={() => router.push("/book-appointment")}
            >
              <Text style={styles.aptChipText}>Check In</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { patient, appointments, invoices, questionnaires } = useAppContext();
  const pendingForms = questionnaires.filter((q) => q.status === "pending").length;
  const unpaidInvoices = invoices.filter((inv) => inv.status !== "paid").length;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const openWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`whatsapp://send?phone=${WHATSAPP_NUMBER}`).catch(() =>
      Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`)
    );
  };

  const callClinic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${CLINIC_PHONE}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.recordNum}>Record: {patient.recordNumber}</Text>
          </View>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {patient.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </Text>
            </LinearGradient>
            {pendingForms > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingForms}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Upcoming appointment */}
          <UpcomingAppointmentCard />

          {/* Alert banners */}
          {pendingForms > 0 && (
            <Pressable
              style={styles.alertBanner}
              onPress={() => router.push("/(tabs)/health")}
            >
              <Feather name="alert-circle" size={16} color={Colors.warning} />
              <Text style={styles.alertText}>
                You have {pendingForms} pending form{pendingForms > 1 ? "s" : ""} to complete
              </Text>
              <Feather name="chevron-right" size={16} color={Colors.warning} />
            </Pressable>
          )}
          {unpaidInvoices > 0 && (
            <Pressable
              style={[styles.alertBanner, { backgroundColor: Colors.dangerLight }]}
              onPress={() => router.push("/(tabs)/billing")}
            >
              <Feather name="file-text" size={16} color={Colors.danger} />
              <Text style={[styles.alertText, { color: Colors.danger }]}>
                {unpaidInvoices} unpaid invoice{unpaidInvoices > 1 ? "s" : ""} pending payment
              </Text>
              <Feather name="chevron-right" size={16} color={Colors.danger} />
            </Pressable>
          )}

          {/* Quick actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon={<Feather name="calendar" size={22} color={Colors.primary} />}
              label="Book"
              onPress={() => router.push("/book-appointment")}
              bg="#EEF6FB"
            />
            <QuickAction
              icon={<Feather name="check-circle" size={22} color={Colors.success} />}
              label="Check In"
              onPress={() => router.push("/(tabs)/appointments")}
              bg={Colors.successLight}
            />
            <QuickAction
              icon={<Feather name="credit-card" size={22} color={Colors.info} />}
              label="Pay Bill"
              onPress={() => router.push("/(tabs)/billing")}
              bg={Colors.infoLight}
            />
            <QuickAction
              icon={<MaterialCommunityIcons name="file-document-edit-outline" size={22} color={Colors.warning} />}
              label="Request"
              onPress={() => router.push("/request")}
              bg={Colors.warningLight}
            />
            <QuickAction
              icon={<Feather name="phone-call" size={22} color={Colors.primary} />}
              label="Call Us"
              onPress={callClinic}
              bg="#EEF6FB"
            />
            <QuickAction
              icon={<MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />}
              label="WhatsApp"
              onPress={openWhatsApp}
              bg="#E8F9EE"
            />
          </View>

          {/* Contact section */}
          <Text style={styles.sectionTitle}>Contact Clinic</Text>
          <View style={styles.contactRow}>
            <Pressable style={[styles.contactBtn, { backgroundColor: Colors.primary }]} onPress={callClinic}>
              <Feather name="phone" size={18} color="#fff" />
              <Text style={styles.contactBtnText}>Call Clinic</Text>
            </Pressable>
            <Pressable style={[styles.contactBtn, { backgroundColor: "#25D366" }]} onPress={openWhatsApp}>
              <MaterialCommunityIcons name="whatsapp" size={18} color="#fff" />
              <Text style={styles.contactBtnText}>WhatsApp</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
  },
  patientName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
    marginTop: 2,
  },
  recordNum: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#fff",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  aptCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  aptGradient: { padding: 18 },
  aptRow: { flexDirection: "row", alignItems: "flex-start" },
  aptLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  aptDoctor: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#fff" },
  aptSpecialty: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  aptDateRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  aptDate: { fontFamily: "Inter_500Medium", fontSize: 13, color: "rgba(255,255,255,0.85)" },
  aptActions: { justifyContent: "flex-end" },
  aptChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  aptChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  alertText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.warning,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text,
    marginBottom: 14,
    marginTop: 8,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  quickActionWrap: {
    width: "30%",
    alignItems: "center",
    flex: 1,
    minWidth: 80,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickActionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  contactRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  contactBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
