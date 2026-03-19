import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
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

const CLINIC_PHONE = "+966XXXXXXXXX";
const WHATSAPP_NUMBER = "966XXXXXXXXX";

function MenuItem({
  icon,
  label,
  sublabel,
  onPress,
  danger,
  badge,
  rightContent,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
  badge?: number;
  rightContent?: React.ReactNode;
}) {
  const { isRTL } = useLanguage();
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, danger && { backgroundColor: Colors.dangerLight }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: Colors.danger }]}>{label}</Text>
        {sublabel && <Text style={styles.menuSublabel}>{sublabel}</Text>}
      </View>
      {rightContent ? rightContent : null}
      {badge ? (
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeNum}>{badge}</Text>
        </View>
      ) : null}
      <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { patient, questionnaires, invoices, familyMembers, removeFamilyMember } = useAppContext();
  const { t, language, isRTL, toggleLanguage } = useLanguage();
  const pendingForms = questionnaires.filter((q) => q.status === "pending").length;
  const unpaidInvoices = invoices.filter((inv) => inv.status !== "paid").length;

  const callClinic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${CLINIC_PHONE}`);
  };

  const openWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`whatsapp://send?phone=${WHATSAPP_NUMBER}`).catch(() =>
      Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`)
    );
  };

  const handleRemoveMember = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t.removeMemberConfirm, t.removeMemberMsg(name), [
      { text: t.cancel, style: "cancel" },
      {
        text: t.removeMember,
        style: "destructive",
        onPress: () => {
          removeFamilyMember(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const displayName = language === "ar" ? patient.nameAr : patient.name;
  const altName = language === "ar" ? patient.name : patient.nameAr;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16 }]}>
        <Text style={styles.title}>{t.profile}</Text>
        <Pressable
          style={styles.langToggle}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleLanguage();
          }}
        >
          <MaterialCommunityIcons name="translate" size={16} color={Colors.primary} />
          <Text style={styles.langToggleText}>
            {language === "en" ? t.switchToArabic : t.switchToEnglish}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient card */}
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.patientCard}
        >
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>
              {patient.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </Text>
          </View>
          <Text style={styles.patientName}>{displayName}</Text>
          <Text style={styles.patientNameAlt}>{altName}</Text>
          <View style={styles.patientMeta}>
            <View style={styles.metaChip}>
              <Feather name="hash" size={11} color="rgba(255,255,255,0.8)" />
              <Text style={styles.metaText}>{patient.recordNumber}</Text>
            </View>
            <View style={styles.metaChip}>
              <Feather name="phone" size={11} color="rgba(255,255,255,0.8)" />
              <Text style={styles.metaText}>{patient.phone}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick contact */}
        <View style={styles.contactRow}>
          <Pressable style={styles.contactBtn} onPress={callClinic}>
            <Feather name="phone" size={20} color={Colors.primary} />
            <Text style={styles.contactLabel}>{t.callClinic}</Text>
          </Pressable>
          <View style={styles.contactDivider} />
          <Pressable style={styles.contactBtn} onPress={openWhatsApp}>
            <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
            <Text style={styles.contactLabel}>{t.whatsAppChat}</Text>
          </Pressable>
        </View>

        {/* Family Members */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.familyMembers}</Text>
          <Pressable
            style={styles.addFamilyBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/add-family-member");
            }}
          >
            <Feather name="user-plus" size={14} color={Colors.primary} />
            <Text style={styles.addFamilyBtnText}>{t.addFamilyMember}</Text>
          </Pressable>
        </View>

        {familyMembers.length === 0 ? (
          <View style={styles.emptyFamily}>
            <View style={styles.emptyFamilyIconWrap}>
              <MaterialCommunityIcons name="account-group-outline" size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyFamilyText}>{t.noFamilyMembers}</Text>
            <Text style={styles.emptyFamilyHint}>{t.noFamilyMembersHint}</Text>
            <Pressable
              style={styles.emptyAddBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/add-family-member");
              }}
            >
              <Feather name="plus" size={16} color={Colors.primary} />
              <Text style={styles.emptyAddBtnText}>{t.addFamilyMember}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.menuGroup}>
            {familyMembers.map((member, idx) => (
              <View key={member.id}>
                {idx > 0 && <View style={styles.menuDivider} />}
                <View style={styles.familyMemberRow}>
                  <View style={styles.familyAvatar}>
                    <Text style={styles.familyAvatarText}>
                      {member.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.familyName}>
                      {language === "ar" ? member.nameAr : member.name}
                    </Text>
                    <View style={styles.familyMeta}>
                      <View style={styles.familyRelBadge}>
                        <Text style={styles.familyRelText}>
                          {language === "ar" ? member.relationshipAr : member.relationship}
                        </Text>
                      </View>
                      <Text style={styles.familyId}>••••{member.idNumber.slice(-4)}</Text>
                    </View>
                  </View>
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() =>
                      handleRemoveMember(
                        member.id,
                        language === "ar" ? member.nameAr : member.name
                      )
                    }
                    hitSlop={8}
                  >
                    <Feather name="trash-2" size={16} color={Colors.danger} />
                  </Pressable>
                </View>
              </View>
            ))}
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.addAnotherRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/add-family-member");
              }}
            >
              <View style={[styles.menuIcon, { backgroundColor: "#EEF6FB" }]}>
                <Feather name="user-plus" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.addAnotherText}>{t.addFamilyMember}</Text>
              <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={18} color={Colors.textMuted} />
            </Pressable>
          </View>
        )}

        {/* My Records */}
        <Text style={styles.sectionTitle}>{t.myRecords}</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon={<Feather name="calendar" size={20} color={Colors.primary} />}
            label={t.appointments}
            sublabel={t.manageVisits}
            onPress={() => router.push("/(tabs)/appointments")}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon={<Feather name="credit-card" size={20} color={Colors.info} />}
            label={t.billing}
            sublabel={t.viewPayBills}
            onPress={() => router.push("/(tabs)/billing")}
            badge={unpaidInvoices || undefined}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon={<MaterialCommunityIcons name="prescription" size={20} color={Colors.accent} />}
            label={t.prescriptions}
            sublabel={t.doctorPrescriptions}
            onPress={() => router.push("/(tabs)/health")}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon={<Feather name="file-text" size={20} color={Colors.warning} />}
            label={t.formsConsents}
            sublabel={t.formsSignatures}
            onPress={() => router.push("/(tabs)/health")}
            badge={pendingForms || undefined}
          />
        </View>

        {/* Services */}
        <Text style={styles.sectionTitle}>{t.services}</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon={<Feather name="plus-square" size={20} color={Colors.primary} />}
            label={t.bookAppointmentTitle}
            onPress={() => router.push("/book-appointment")}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon={<MaterialCommunityIcons name="file-document-edit-outline" size={20} color={Colors.warning} />}
            label={t.submitRequest}
            sublabel={t.sickLeaveReports}
            onPress={() => router.push("/request")}
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionTitle}>{t.support}</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon={<Feather name="phone-call" size={20} color={Colors.primary} />}
            label={t.callClinic}
            sublabel={t.speakToTeam}
            onPress={callClinic}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon={<MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />}
            label={t.whatsAppChat}
            sublabel={t.messageInstantly}
            onPress={openWhatsApp}
          />
        </View>

        {/* Language */}
        <Text style={styles.sectionTitle}>{t.language}</Text>
        <View style={styles.menuGroup}>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleLanguage();
            }}
          >
            <View style={styles.menuIcon}>
              <MaterialCommunityIcons name="translate" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{t.language}</Text>
              <Text style={styles.menuSublabel}>
                {language === "en" ? "English → العربية" : "العربية → English"}
              </Text>
            </View>
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeText}>{language === "en" ? "EN" : "AR"}</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.versionBox}>
          <Text style={styles.versionText}>{t.appVersion}</Text>
          <Text style={styles.versionSub}>{t.website}</Text>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.text },
  langToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EEF6FB",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  langToggleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  patientCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  patientAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  patientAvatarText: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#fff" },
  patientName: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#fff" },
  patientNameAlt: { fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  patientMeta: { flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap", justifyContent: "center" },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  metaText: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.9)" },
  contactRow: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  contactBtn: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 6 },
  contactLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  contactDivider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text, marginBottom: 10 },
  addFamilyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EEF6FB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  addFamilyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.primary },
  emptyFamily: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  emptyFamilyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.backgroundMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyFamilyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    marginBottom: 6,
  },
  emptyFamilyHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 16,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyAddBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.primary },
  menuGroup: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    overflow: "hidden",
  },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.backgroundMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  menuSublabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  menuDivider: { height: 1, backgroundColor: Colors.borderLight, marginStart: 70 },
  badgeWrap: { backgroundColor: Colors.danger, borderRadius: 12, minWidth: 22, height: 22, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeNum: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#fff" },
  familyMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  familyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary + "40",
  },
  familyAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.primary,
  },
  familyName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    marginBottom: 4,
  },
  familyMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  familyRelBadge: {
    backgroundColor: Colors.primary + "18",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  familyRelText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.primary,
  },
  familyId: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  addAnotherRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  addAnotherText: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.primary,
  },
  langBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  langBadgeText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" },
  versionBox: { alignItems: "center", paddingVertical: 24 },
  versionText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted },
  versionSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
