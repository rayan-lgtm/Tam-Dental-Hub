import AsyncStorage from "@react-native-async-storage/async-storage";
import { reloadAppAsync } from "expo";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { I18nManager, Alert } from "react-native";
import { translations, type Language } from "@/constants/translations";

const LANGUAGE_KEY = "@tam_dental_language";

type LanguageContextType = {
  language: Language;
  t: typeof translations.en;
  isRTL: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>("en");

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored === "ar" || stored === "en") {
        setLangState(stored);
        const shouldRTL = stored === "ar";
        if (I18nManager.isRTL !== shouldRTL) {
          I18nManager.allowRTL(shouldRTL);
          I18nManager.forceRTL(shouldRTL);
        }
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    const shouldRTL = lang === "ar";
    setLangState(lang);
    if (I18nManager.isRTL !== shouldRTL) {
      I18nManager.allowRTL(shouldRTL);
      I18nManager.forceRTL(shouldRTL);
      Alert.alert(
        lang === "ar" ? "تم تغيير اللغة" : "Language Changed",
        lang === "ar"
          ? "سيتم إعادة تشغيل التطبيق لتطبيق اللغة العربية."
          : "The app will restart to apply the language change.",
        [
          {
            text: lang === "ar" ? "حسناً" : "OK",
            onPress: () => reloadAppAsync(),
          },
        ]
      );
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "ar" : "en");
  }, [language, setLanguage]);

  const t = translations[language];
  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, t, isRTL, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
