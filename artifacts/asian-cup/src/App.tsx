import { useCallback, useEffect, useMemo, useState } from "react";
import { Home as HomeIcon, CalendarDays, LayoutGrid, Trophy } from "lucide-react";
import { api, auth, ApiError } from "./api";
import { AppContext, setServerTime, type Tab } from "./store";
import type { Match, Me, Meta } from "./types";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Matches from "./pages/Matches";
import Groups from "./pages/Groups";
import Leaderboard from "./pages/Leaderboard";
import Rules from "./pages/Rules";
import { Header } from "./components/Header";
import { Spinner } from "./components/ui";

const TABS: { id: Tab; label: string; icon: typeof HomeIcon }[] = [
  { id: "home", label: "الرئيسية", icon: HomeIcon },
  { id: "matches", label: "المباريات", icon: CalendarDays },
  { id: "groups", label: "المجموعات", icon: LayoutGrid },
  { id: "board", label: "الترتيب", icon: Trophy },
];

const tabFromHash = (): Tab => {
  const h = window.location.hash.replace("#", "") as Tab;
  return ["home", "matches", "groups", "board", "rules"].includes(h) ? h : "home";
};

export default function App() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [token, setToken] = useState(auth.token);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(tabFromHash);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = useCallback((t: Tab) => {
    window.location.hash = t;
    window.scrollTo({ top: 0 });
  }, []);

  const logout = useCallback(() => {
    api("/logout", { method: "POST" }).catch(() => {});
    auth.token = null;
    setToken(null);
    setMe(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [m, ms] = await Promise.all([api<Meta>("/meta"), api<Match[]>("/matches")]);
      setServerTime(m.serverTime);
      setMeta(m);
      setMatches(ms);
      if (auth.token) setMe(await api<Me>("/me"));
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) logout();
      else setError(e instanceof Error ? e.message : "حدث خطأ");
    }
  }, [logout]);

  useEffect(() => {
    void refresh();
  }, [refresh, token]);

  const team = useMemo(() => {
    const map = new Map(meta?.teams.map((t) => [t.code, t]));
    return (code: string | null) => (code ? map.get(code) : undefined);
  }, [meta]);

  if (!meta) {
    return (
      <div className="hero-bg flex min-h-dvh flex-col items-center justify-center gap-4 text-white">
        <img src={`${import.meta.env.BASE_URL}logo-light.png`} alt="تام دنتال TAM Dental" className="h-14 w-auto" />
        {error ? (
          <>
            <p className="px-8 text-center text-sm">{error}</p>
            <button className="rounded-full bg-white/15 px-5 py-2 text-sm" onClick={() => void refresh()}>
              إعادة المحاولة
            </button>
          </>
        ) : (
          <Spinner />
        )}
      </div>
    );
  }

  if (!token) {
    return (
      <Auth
        meta={meta}
        onAuthed={(t) => {
          auth.token = t;
          setToken(t);
        }}
      />
    );
  }

  if (!me) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
        {error ? (
          <>
            <p className="px-8 text-center text-sm text-muted">{error}</p>
            <button className="rounded-full bg-brand px-5 py-2 text-sm text-white" onClick={() => void refresh()}>
              إعادة المحاولة
            </button>
          </>
        ) : (
          <Spinner className="text-brand" />
        )}
      </div>
    );
  }

  const state = { meta, matches, me, team, refresh, logout, go };

  return (
    <AppContext.Provider value={state}>
      <div className="mx-auto min-h-dvh max-w-md bg-page pb-24 shadow-[0_0_40px_rgba(13,27,42,0.06)]">
        <Header />
        <main className="px-4 pt-4">
          {tab === "home" && <Home />}
          {tab === "matches" && <Matches />}
          {tab === "groups" && <Groups />}
          {tab === "board" && <Leaderboard />}
          {tab === "rules" && <Rules />}
        </main>
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-line bg-white/95 backdrop-blur">
          <div className="grid grid-cols-4">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => go(id)}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                    active ? "text-brand" : "text-brand-light"
                  }`}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </AppContext.Provider>
  );
}
