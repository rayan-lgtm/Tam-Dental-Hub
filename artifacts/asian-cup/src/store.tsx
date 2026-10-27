import { createContext, useContext } from "react";
import type { Match, Me, Meta, Team } from "./types";

let clockOffset = 0;
export const setServerTime = (iso: string) => {
  clockOffset = new Date(iso).getTime() - Date.now();
};
export const now = () => Date.now() + clockOffset;

export interface AppState {
  meta: Meta;
  matches: Match[];
  me: Me;
  team: (code: string | null) => Team | undefined;
  refresh: () => Promise<void>;
  logout: () => void;
  go: (tab: Tab) => void;
}

export type Tab = "home" | "matches" | "groups" | "board" | "rules";

export const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("AppContext missing");
  return ctx;
}
