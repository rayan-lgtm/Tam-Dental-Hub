import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const AUTH_KEY = "@tam_dental_auth";
export const DEMO_OTP = "123456";

type AuthContextType = {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then((v) => {
      setIsLoggedIn(v === "1");
      setIsAuthLoading(false);
    });
  }, []);

  const login = useCallback(() => {
    setIsLoggedIn(true);
    AsyncStorage.setItem(AUTH_KEY, "1");
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    AsyncStorage.removeItem(AUTH_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAuthLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
