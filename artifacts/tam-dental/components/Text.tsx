import React from "react";
import {
  StyleSheet,
  Text as RNText,
  TextProps,
  TextStyle,
} from "react-native";
import { useLanguage } from "@/context/LanguageContext";

const INTER_TO_TAJAWAL: Record<string, string> = {
  Inter_400Regular: "Tajawal_400Regular",
  Inter_500Medium: "Tajawal_500Medium",
  Inter_600SemiBold: "Tajawal_700Bold",
  Inter_700Bold: "Tajawal_700Bold",
};

export function Text({ style, ...props }: TextProps) {
  const { language } = useLanguage();

  if (language !== "ar") {
    return <RNText style={style} {...props} />;
  }

  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const original = flat?.fontFamily;
  const tajawal = original ? (INTER_TO_TAJAWAL[original] ?? "Tajawal_400Regular") : "Tajawal_400Regular";

  return <RNText style={[style, { fontFamily: tajawal }]} {...props} />;
}
