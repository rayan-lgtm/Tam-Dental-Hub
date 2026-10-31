import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, PlusCircle, Settings as SettingsIcon, BookOpenCheck, LogOut, ListChecks } from "lucide-react";
import { api, auth, ApiError } from "./api";
import type { Meta } from "./types";
import { Spinner, ErrorBox } from "./components/ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AgentPage from "./pages/Agent";
import Conversation from "./pages/Conversation";
import Conversations from "./pages/Conversations";
import NewConversation from "./pages/NewConversation";
import Settings from "./pages/Settings";
import Rubric from "./pages/Rubric";

type Route =
  | { page: "dashboard" }
  | { page: "agent"; id: number }
  | { page: "conv"; id: number }
  | { page: "list" }
  | { page: "new" }
  | { page: "settings" }
  | { page: "rubric" };

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  const [p, id] = h.split("/");
  if (p === "agent" && id) return { page: "agent", id: Number(id) };
  if (p === "conv" && id) return { page: "conv", id: Number(id) };
  if (p === "list" || p === "new" || p === "settings" || p === "rubric") return { page: p };
  return { page: "dashboard" };
}

export const go = (path: string) => {
  window.location.hash = path;
};

const NAV = [
  { path: "", page: "dashboard", label: "لوحة المتابعة", icon: LayoutDashboard },
  { path: "list", page: "list", label: "المحادثات", icon: ListChecks },
  { path: "new", page: "new", label: "تقييم محادثة", icon: PlusCircle },
  { path: "rubric", page: "rubric", label: "معايير التقييم", icon: BookOpenCheck },
  { path: "settings", page: "settings", label: "الإعدادات", icon: SettingsIcon },
] as const;

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [authed, setAuthed] = useState(!!auth.key);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const on = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const loadMeta = useCallback(async () => {
    setError(null);
    try {
      setMeta(await api<Meta>("/meta"));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        auth.key = null;
        setAuthed(false);
      } else setError(e instanceof Error ? e.message : "حدث خطأ");
    }
  }, []);

  useEffect(() => {
    if (authed) void loadMeta();
  }, [authed, loadMeta]);

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  const logout = () => {
    auth.key = null;
    setMeta(null);
    setAuthed(false);
  };

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 bg-navy text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <img src={`${import.meta.env.BASE_URL}logo-light.png`} alt="تام دنتال" className="h-8 w-auto" />
          <div className="border-s border-white/20 ps-3">
            <div className="text-sm font-bold">جودة الخدمة والضيافة</div>
            <div className="text-[11px] text-white/60">تحليل يومي للمكالمات والشات</div>
          </div>
          <button onClick={logout} className="ms-auto rounded-lg p-2 text-white/70 hover:bg-white/10" title="خروج">
            <LogOut className="size-4" />
          </button>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((n) => {
            const active =
              route.page === n.page || (n.page === "dashboard" && route.page === "agent") || (n.page === "list" && route.page === "conv");
            return (
              <a
                key={n.page}
                href={`#/${n.path}`}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active ? "bg-white text-navy" : "text-white/75 hover:bg-white/10"
                }`}
              >
                <n.icon className="size-4" />
                {n.label}
              </a>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5">
        {error ? (
          <ErrorBox message={error} />
        ) : !meta ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : route.page === "dashboard" ? (
          <Dashboard meta={meta} />
        ) : route.page === "agent" ? (
          <AgentPage id={route.id} meta={meta} />
        ) : route.page === "conv" ? (
          <Conversation id={route.id} meta={meta} />
        ) : route.page === "list" ? (
          <Conversations />
        ) : route.page === "new" ? (
          <NewConversation meta={meta} />
        ) : route.page === "rubric" ? (
          <Rubric meta={meta} />
        ) : (
          <Settings meta={meta} onChanged={loadMeta} />
        )}
      </main>
    </div>
  );
}
