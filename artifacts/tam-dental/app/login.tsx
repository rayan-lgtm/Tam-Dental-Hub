import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
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
import { DEMO_OTP, useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const COUNTRY_CODE = "+966";
const OTP_LENGTH = 6;

type Step = "phone" | "otp";

const L = {
  primary: "#1691D0",
  primaryDark: "#0d7bbf",
  primaryLight: "#1C9FE0",
  secondary: "#87B3D4",
  gray: "#6F7374",
  white: "#FFFFFF",
  bg: "#F4F8FC",
  inputBorder: "#C8DDF0",
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn, isAuthLoading, login } = useAuth();
  const { t, isRTL, language } = useLanguage();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  if (isAuthLoading) return null;
  if (isLoggedIn) return <Redirect href="/(tabs)" />;

  const isPhoneValid =
    phone.length >= 9 &&
    phone.length <= 10 &&
    /^5/.test(phone);

  const handleSendOtp = () => {
    if (!isPhoneValid) {
      Alert.alert(t.loginInvalidPhone, t.loginInvalidPhoneMsg);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep("otp");
      setCountdown(60);
      setOtp("");
      setTimeout(() => otpInputRef.current?.focus(), 400);
    }, 1400);
  };

  const handleVerify = () => {
    if (otp.length < OTP_LENGTH) return;
    if (otp !== DEMO_OTP) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t.loginInvalidOtp, t.loginInvalidOtpMsg);
      setOtp("");
      setTimeout(() => otpInputRef.current?.focus(), 100);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      login();
    }, 900);
  };

  const handleResend = () => {
    if (countdown > 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOtp("");
    setCountdown(60);
    setTimeout(() => otpInputRef.current?.focus(), 100);
  };

  const focusedBox = Math.min(otp.length, OTP_LENGTH - 1);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={[L.primaryLight, L.primary, L.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 20 }]}
      >
        <View style={styles.logoRow}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logoIconBox}
          />
          <View>
            <Text style={styles.logoName}>TAM Dental</Text>
            <Text style={styles.logoNameAr}>عيادات تام للأسنان</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>{t.loginWelcome}</Text>
        <Text style={styles.heroSub}>{t.loginSubtitle}</Text>

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, step === "phone" ? styles.stepDotActive : styles.stepDotInactive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step === "otp" ? styles.stepDotActive : styles.stepDotInactive]} />
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <ScrollView
          contentContainerStyle={[
            styles.cardContent,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === "phone" && (
            <View>
              <Text style={styles.cardTitle}>{t.loginSignIn}</Text>
              <Text style={styles.cardSub}>{t.loginPhonePrompt}</Text>

              <Text style={styles.fieldLabel}>{t.loginPhone}</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryPill}>
                  <Text style={styles.flag}>🇸🇦</Text>
                  <Text style={styles.countryCode}>{COUNTRY_CODE}</Text>
                </View>
                <TextInput
                  style={[styles.phoneInput, { textAlign: isRTL ? "right" : "left" }]}
                  placeholder={t.loginPhonePlaceholder}
                  placeholderTextColor={L.secondary}
                  value={phone}
                  onChangeText={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
                  keyboardType="phone-pad"
                  maxLength={10}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOtp}
                  autoFocus
                />
                {isPhoneValid && (
                  <View style={styles.phoneTick}>
                    <Feather name="check-circle" size={18} color="#22C55E" />
                  </View>
                )}
              </View>

              <Pressable
                style={[
                  styles.primaryBtn,
                  (!isPhoneValid || sending) && styles.primaryBtnDisabled,
                ]}
                onPress={handleSendOtp}
                disabled={!isPhoneValid || sending}
              >
                {sending ? (
                  <Text style={styles.primaryBtnText}>{t.loginSendingOtp}</Text>
                ) : (
                  <>
                    <Feather name="send" size={18} color={L.white} />
                    <Text style={styles.primaryBtnText}>{t.loginSendOtp}</Text>
                  </>
                )}
              </Pressable>

              <View style={styles.demoHint}>
                <Feather name="info" size={13} color={L.secondary} />
                <Text style={styles.demoHintText}>{t.loginDemoNote}</Text>
              </View>
            </View>
          )}

          {step === "otp" && (
            <View>
              <Pressable
                style={[styles.backBtn, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                onPress={() => { setStep("phone"); setOtp(""); }}
              >
                <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={16} color={L.primary} />
                <Text style={styles.backBtnText}>{t.back}</Text>
              </Pressable>

              <Text style={styles.cardTitle}>{t.loginOtpLabel}</Text>
              <Text style={styles.cardSub}>{t.loginOtpSentMsg(phone)}</Text>

              <View style={styles.otpArea}>
                <TextInput
                  ref={otpInputRef}
                  style={styles.otpHidden}
                  value={otp}
                  onChangeText={(v) => {
                    const cleaned = v.replace(/\D/g, "").slice(0, OTP_LENGTH);
                    setOtp(cleaned);
                    if (cleaned.length === OTP_LENGTH) {
                      setTimeout(() => {
                        if (cleaned === DEMO_OTP) {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          setVerifying(true);
                          setTimeout(() => { setVerifying(false); login(); }, 900);
                        } else {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        }
                      }, 200);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={OTP_LENGTH}
                  autoFocus
                  caretHidden
                />
                <View style={styles.otpBoxRow}>
                  {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                    <Pressable
                      key={i}
                      style={[
                        styles.otpBox,
                        otp[i] ? styles.otpBoxFilled : null,
                        !otp[i] && otp.length === i ? styles.otpBoxFocused : null,
                      ]}
                      onPress={() => otpInputRef.current?.focus()}
                    >
                      <Text style={styles.otpDigit}>{otp[i] ?? ""}</Text>
                      {!otp[i] && otp.length === i && <View style={styles.cursor} />}
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                style={[
                  styles.primaryBtn,
                  (otp.length < OTP_LENGTH || verifying) && styles.primaryBtnDisabled,
                ]}
                onPress={handleVerify}
                disabled={otp.length < OTP_LENGTH || verifying}
              >
                {verifying ? (
                  <Text style={styles.primaryBtnText}>{t.loginVerifying}</Text>
                ) : (
                  <>
                    <Feather name="shield" size={18} color={L.white} />
                    <Text style={styles.primaryBtnText}>{t.loginVerify}</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={styles.resendRow}
                onPress={handleResend}
                disabled={countdown > 0}
              >
                <Text
                  style={[
                    styles.resendText,
                    countdown > 0 && styles.resendTextDisabled,
                  ]}
                >
                  {countdown > 0 ? t.loginResendIn(countdown) : t.loginResend}
                </Text>
              </Pressable>

              <View style={styles.demoHint}>
                <Feather name="info" size={13} color={L.secondary} />
                <Text style={styles.demoHintText}>{t.loginDemoNote}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.primaryDark },
  header: {
    paddingHorizontal: 28,
    paddingBottom: 56,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 32,
  },
  logoIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  logoName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: L.white,
    letterSpacing: 0.3,
  },
  logoNameAr: {
    fontFamily: "Tajawal_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    color: L.white,
    marginBottom: 6,
  },
  heroSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepDotActive: { backgroundColor: L.white },
  stepDotInactive: { backgroundColor: "rgba(255,255,255,0.35)" },
  stepLine: {
    flex: 0,
    width: 32,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
    marginHorizontal: 6,
  },
  card: {
    flex: 1,
    backgroundColor: L.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  cardContent: {
    padding: 28,
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#0D1B2A",
    marginBottom: 6,
    marginTop: 4,
  },
  cardSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: L.gray,
    lineHeight: 21,
    marginBottom: 28,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#0D1B2A",
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: L.inputBorder,
    borderRadius: 14,
    height: 58,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: L.bg,
  },
  countryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: "100%",
    backgroundColor: "#E8F3FB",
    borderEndWidth: 1.5,
    borderEndColor: L.inputBorder,
  },
  flag: { fontSize: 20 },
  countryCode: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: L.primary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#0D1B2A",
    letterSpacing: 1.5,
    height: "100%",
  },
  phoneTick: {
    paddingRight: 14,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: L.primary,
    borderRadius: 14,
    paddingVertical: 17,
    elevation: 5,
    shadowColor: L.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    marginBottom: 16,
  },
  primaryBtnDisabled: {
    backgroundColor: L.secondary,
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: L.white,
  },
  demoHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EEF6FB",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  demoHintText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: L.gray,
    lineHeight: 18,
  },
  backBtn: {
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingVertical: 4,
  },
  backBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: L.primary,
  },
  otpArea: {
    position: "relative",
    marginBottom: 28,
    alignItems: "center",
  },
  otpHidden: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  otpBoxRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingVertical: 4,
  },
  otpBox: {
    width: 48,
    height: 58,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: L.inputBorder,
    backgroundColor: L.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxFocused: {
    borderColor: L.primary,
    borderWidth: 2,
    backgroundColor: "#EEF6FB",
  },
  otpBoxFilled: {
    borderColor: L.primary,
    backgroundColor: "#EEF6FB",
  },
  otpDigit: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: L.primary,
  },
  cursor: {
    position: "absolute",
    width: 2,
    height: 24,
    backgroundColor: L.primary,
    borderRadius: 1,
  },
  resendRow: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  resendText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: L.primary,
  },
  resendTextDisabled: {
    color: L.secondary,
  },
});
