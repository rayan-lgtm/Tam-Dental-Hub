import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, KeyRound, LogOut, RefreshCw, Save, Search, Trophy } from "lucide-react";
import { api, auth } from "../api";
import { setServerTime } from "../store";
import { Button, Card, Chips, Flag, Spinner } from "../components/ui";
import { fmtDateTime, fromKsaInput, toKsaInput } from "../format";
import { BOARD_NAMES, type Board, type LeaderRow, type Match, type Meta, type Stage, type Team } from "../types";

type AdminTab = "results" | "groups" | "settings" | "people";

interface Participant {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
  boards: Record<Board, { points: number; rank: number } | null>;
}

interface WinnerRow {
  board: Board;
  rank: number;
  points: number;
  participantId: number;
  name: string;
  phone: string;
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(!!auth.adminKey);
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      await api("/admin/check", { admin: true });
      setAuthed(true);
    } catch (e) {
      auth.adminKey = null;
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (auth.adminKey) void check();
  }, [check]);

  if (!authed) {
    return (
      <div className="hero-bg flex min-h-dvh items-center justify-center p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            auth.adminKey = key;
            void check();
          }}
          className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl"
        >
          <img src={`${import.meta.env.BASE_URL}icon.png`} alt="" className="mx-auto size-14 rounded-2xl" />
          <h1 className="mt-3 text-center text-lg font-bold text-navy">لوحة إدارة مسابقة كأس آسيا</h1>
          <label className="mt-5 flex items-center gap-2 rounded-xl border border-line px-3 py-3">
            <KeyRound className="size-4 text-brand-light" />
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="مفتاح الإدارة"
              className="w-full outline-none"
              autoFocus
            />
          </label>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <Button type="submit" loading={checking} className="mt-4 w-full">
            دخول
          </Button>
        </form>
      </div>
    );
  }

  return <Dashboard onLogout={() => ((auth.adminKey = null), setAuthed(false))} />;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>("results");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  const load = useCallback(async () => {
    const [m, ms] = await Promise.all([api<Meta>("/meta"), api<Match[]>("/matches")]);
    setServerTime(m.serverTime);
    setMeta(m);
    setMatches(ms);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const teamMap = useMemo(() => new Map(meta?.teams.map((t) => [t.code, t])), [meta]);

  if (!meta)
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="text-brand" />
      </div>
    );

  return (
    <div className="mx-auto min-h-dvh max-w-3xl pb-16">
      <header className="hero-bg sticky top-0 z-20 flex items-center justify-between px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}icon.png`} alt="" className="size-8 rounded-lg" />
          <span className="text-sm font-bold">إدارة مسابقة التوقعات</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="rounded-full bg-white/10 p-2" aria-label="تحديث">
            <RefreshCw className="size-4" />
          </button>
          <button onClick={onLogout} className="rounded-full bg-white/10 p-2" aria-label="خروج">
            <LogOut className="size-4" />
          </button>
        </div>
      </header>
      <div className="px-4 pt-4">
        <Chips<AdminTab>
          items={[
            { id: "results", label: "النتائج والمتأهلين" },
            { id: "groups", label: "ترتيب المجموعات" },
            { id: "settings", label: "الأدوار والفائزين" },
            { id: "people", label: "المشاركون" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="mt-4">
          {tab === "results" && <Results meta={meta} matches={matches} teamMap={teamMap} reload={load} />}
          {tab === "groups" && <GroupResults meta={meta} matches={matches} teamMap={teamMap} />}
          {tab === "settings" && <SettingsPanel meta={meta} reload={load} />}
          {tab === "people" && <People />}
        </div>
      </div>
    </div>
  );
}

// ---------------- Results ----------------

function Results({
  meta,
  matches,
  teamMap,
  reload,
}: {
  meta: Meta;
  matches: Match[];
  teamMap: Map<string, Team>;
  reload: () => Promise<void>;
}) {
  const [stage, setStage] = useState<Stage>(meta.settings.currentStage);
  return (
    <div>
      <Chips items={meta.stages.map((s) => ({ id: s.id, label: s.name }))} value={stage} onChange={(v) => setStage(v)} />
      <p className="mt-3 text-xs text-muted">
        أدخل النتيجة بعد نهاية الوقت الأصلي وفعّل "انتهت". في الأدوار الإقصائية حدد طرفي المباراة، وعند التعادل حدد
        المتأهل — يُنقل المتأهل تلقائياً للدور التالي.
      </p>
      <div className="mt-3 space-y-3">
        {matches
          .filter((m) => m.stage === stage)
          .map((m) => (
            <AdminMatch key={m.id} match={m} meta={meta} teamMap={teamMap} reload={reload} />
          ))}
      </div>
    </div>
  );
}

function AdminMatch({
  match,
  meta,
  teamMap,
  reload,
}: {
  match: Match;
  meta: Meta;
  teamMap: Map<string, Team>;
  reload: () => Promise<void>;
}) {
  const [homeTeam, setHomeTeam] = useState(match.homeTeam);
  const [awayTeam, setAwayTeam] = useState(match.awayTeam);
  const [hs, setHs] = useState(match.homeScore?.toString() ?? "");
  const [as, setAs] = useState(match.awayScore?.toString() ?? "");
  const [qualifier, setQualifier] = useState(match.qualifier);
  const [finished, setFinished] = useState(match.finished);
  const [kickoff, setKickoff] = useState(toKsaInput(match.kickoff));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setHomeTeam(match.homeTeam);
    setAwayTeam(match.awayTeam);
    setHs(match.homeScore?.toString() ?? "");
    setAs(match.awayScore?.toString() ?? "");
    setQualifier(match.qualifier);
    setFinished(match.finished);
    setKickoff(toKsaInput(match.kickoff));
  }, [match]);

  const knockout = match.stage !== "group";
  const draw = hs !== "" && hs === as;

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await api(`/admin/matches/${match.id}`, {
        method: "PUT",
        admin: true,
        body: {
          ...(knockout ? { homeTeam, awayTeam } : {}),
          homeScore: hs === "" ? null : Number(hs),
          awayScore: as === "" ? null : Number(as),
          qualifier: knockout && draw ? qualifier : null,
          finished,
          kickoff: fromKsaInput(kickoff),
        },
      });
      setMsg({ ok: true, text: "تم الحفظ" });
      await reload();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "خطأ" });
    } finally {
      setSaving(false);
    }
  };

  const teamSelect = (value: string | null, onChange: (v: string | null) => void, label: string) =>
    knockout ? (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-lg border border-line bg-white px-2 py-2 text-sm"
      >
        <option value="">{label}</option>
        {meta.teams.map((t) => (
          <option key={t.code} value={t.code}>
            {t.flag} {t.name}
          </option>
        ))}
      </select>
    ) : (
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        <Flag team={teamMap.get(value ?? "")} size="sm" /> {teamMap.get(value ?? "")?.name}
      </span>
    );

  return (
    <Card className={`p-3.5 ${match.finished ? "border-emerald-200" : ""}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
        <span className="font-semibold text-brand-dark">
          مباراة {match.id} {match.groupLetter ? `• المجموعة ${match.groupLetter}` : ""}
        </span>
        <span>
          {fmtDateTime(match.kickoff)} • {match.stadium}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div>
          {teamSelect(homeTeam, setHomeTeam, match.homeLabel)}
        </div>
        <div className="flex items-center gap-1">
          <input
            inputMode="numeric"
            value={hs}
            onChange={(e) => setHs(e.target.value.replace(/\D/g, "").slice(0, 2))}
            className="w-11 rounded-lg border border-line py-2 text-center text-lg font-bold"
          />
          <span>-</span>
          <input
            inputMode="numeric"
            value={as}
            onChange={(e) => setAs(e.target.value.replace(/\D/g, "").slice(0, 2))}
            className="w-11 rounded-lg border border-line py-2 text-center text-lg font-bold"
          />
        </div>
        <div>
          {teamSelect(awayTeam, setAwayTeam, match.awayLabel)}
        </div>
      </div>
      {knockout && draw && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-xs text-muted">المتأهل (أشواط إضافية/ترجيح):</span>
          <select
            value={qualifier ?? ""}
            onChange={(e) => setQualifier(e.target.value || null)}
            className="rounded-lg border border-line px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {[homeTeam, awayTeam].filter(Boolean).map((c) => (
              <option key={c} value={c!}>
                {teamMap.get(c!)?.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          الموعد (KSA)
          <input
            type="datetime-local"
            value={kickoff}
            onChange={(e) => setKickoff(e.target.value)}
            className="rounded-lg border border-line px-2 py-1 text-xs"
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm font-semibold">
          <input type="checkbox" checked={finished} onChange={(e) => setFinished(e.target.checked)} className="size-4 accent-[#1691d0]" />
          انتهت
        </label>
        <span className="flex-1" />
        {msg && <span className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</span>}
        <Button onClick={save} loading={saving} className="px-3 py-1.5 text-xs">
          <Save className="size-3.5" /> حفظ
        </Button>
      </div>
    </Card>
  );
}

// ---------------- Group standings ----------------

interface Row {
  code: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
}

function computeTable(group: string, teams: Team[], matches: Match[]): Row[] {
  const rows = new Map<string, Row>(
    teams.filter((t) => t.group === group).map((t) => [t.code, { code: t.code, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }]),
  );
  for (const m of matches) {
    if (m.groupLetter !== group || !m.finished || m.homeScore == null || m.awayScore == null) continue;
    const h = rows.get(m.homeTeam!)!;
    const a = rows.get(m.awayTeam!)!;
    h.p++;
    a.p++;
    h.gf += m.homeScore;
    h.ga += m.awayScore;
    a.gf += m.awayScore;
    a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) (h.w++, a.l++, (h.pts += 3));
    else if (m.homeScore < m.awayScore) (a.w++, h.l++, (a.pts += 3));
    else (h.d++, a.d++, h.pts++, a.pts++);
  }
  return [...rows.values()].sort((x, y) => y.pts - x.pts || y.gf - y.ga - (x.gf - x.ga) || y.gf - x.gf);
}

function GroupResults({ meta, matches, teamMap }: { meta: Meta; matches: Match[]; teamMap: Map<string, Team> }) {
  const [saved, setSaved] = useState<Record<string, string[]> | null>(null);
  const load = useCallback(async () => {
    const rows = await api<{ groupLetter: string; teams: string[] }[]>("/admin/group-results", { admin: true });
    setSaved(Object.fromEntries(rows.map((r) => [r.groupLetter, r.teams])));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  if (!saved) return <Spinner className="text-brand" />;
  return (
    <div>
      <p className="mb-3 text-xs text-muted">
        الجدول محسوب تلقائياً من النتائج (النقاط ثم فارق الأهداف ثم الأهداف). عدّل الترتيب عند الحاجة حسب قواعد
        الاتحاد الآسيوي ثم اعتمده — يُستخدم لحساب مسابقة ترتيب المجموعات.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {meta.groups.map((g) => (
          <GroupResultCard
            key={g}
            group={g}
            table={computeTable(g, meta.teams, matches)}
            saved={saved[g]}
            teamMap={teamMap}
            reload={load}
          />
        ))}
      </div>
    </div>
  );
}

function GroupResultCard({
  group,
  table,
  saved,
  teamMap,
  reload,
}: {
  group: string;
  table: Row[];
  saved?: string[];
  teamMap: Map<string, Team>;
  reload: () => Promise<void>;
}) {
  const [order, setOrder] = useState<string[]>(saved ?? table.map((r) => r.code));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const byCode = new Map(table.map((r) => [r.code, r]));

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j > 3) return;
    const n = [...order];
    [n[i], n[j]] = [n[j]!, n[i]!];
    setOrder(n);
  };

  const submit = async (method: "PUT" | "DELETE") => {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/admin/group-results/${group}`, { method, admin: true, body: method === "PUT" ? { teams: order } : undefined });
      await reload();
      setMsg(method === "PUT" ? "تم الاعتماد" : "تم الإلغاء");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-navy">المجموعة {group}</h3>
        {saved ? <span className="text-[11px] font-semibold text-emerald-600">معتمد ✓</span> : <span className="text-[11px] text-muted">غير معتمد</span>}
      </div>
      <table className="w-full text-xs">
        <thead className="text-muted">
          <tr>
            <th className="text-right">#</th>
            <th className="text-right">المنتخب</th>
            <th>لعب</th>
            <th>له/عليه</th>
            <th>نقاط</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {order.map((code, i) => {
            const r = byCode.get(code)!;
            return (
              <tr key={code} className="border-t border-line">
                <td className="py-1.5">{i + 1}</td>
                <td className="py-1.5">
                  {teamMap.get(code)?.flag} {teamMap.get(code)?.name}
                </td>
                <td className="text-center">{r.p}</td>
                <td className="text-center" dir="ltr">
                  {r.gf}:{r.ga}
                </td>
                <td className="text-center font-bold">{r.pts}</td>
                <td className="whitespace-nowrap text-left">
                  <button onClick={() => move(i, -1)} className="px-1 text-brand disabled:opacity-30" disabled={i === 0}>
                    ▲
                  </button>
                  <button onClick={() => move(i, 1)} className="px-1 text-brand disabled:opacity-30" disabled={i === 3}>
                    ▼
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-2">
        <Button onClick={() => submit("PUT")} loading={busy} className="px-3 py-1.5 text-xs">
          اعتماد الترتيب
        </Button>
        <Button variant="ghost" onClick={() => setOrder(table.map((r) => r.code))} className="px-3 py-1.5 text-xs">
          حسب الجدول
        </Button>
        {saved && (
          <button onClick={() => submit("DELETE")} className="text-xs text-red-600">
            إلغاء الاعتماد
          </button>
        )}
        {msg && <span className="text-xs text-muted">{msg}</span>}
      </div>
    </Card>
  );
}

// ---------------- Settings & winners ----------------

const BOARDS: Board[] = ["group", "r16", "qf", "sf", "final", "groups", "overall"];

function SettingsPanel({ meta, reload }: { meta: Meta; reload: () => Promise<void> }) {
  const s = meta.settings;
  const [currentStage, setCurrentStage] = useState(s.currentStage);
  const [champion, setChampion] = useState(s.champion ?? "");
  const [groupsDeadline, setGroupsDeadline] = useState(toKsaInput(s.groupsDeadline));
  const [championDeadline, setChampionDeadline] = useState(toKsaInput(s.championDeadline));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [winners, setWinners] = useState<WinnerRow[]>([]);

  const loadWinners = useCallback(async () => {
    setWinners(await api<WinnerRow[]>("/admin/winners", { admin: true }));
  }, []);
  useEffect(() => {
    void loadWinners();
  }, [loadWinners]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await api("/admin/settings", {
        method: "PUT",
        admin: true,
        body: {
          currentStage,
          champion: champion || null,
          groupsDeadline: fromKsaInput(groupsDeadline),
          championDeadline: fromKsaInput(championDeadline),
        },
      });
      await reload();
      setMsg("تم الحفظ");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "خطأ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-bold text-navy">الدور الحالي والإعدادات</h3>
        <p className="text-xs text-muted">
          الدور الحالي هو ما يظهر للمشاركين في الرئيسية كعدّاد نقاط (يبدأ من الصفر لكل دور). بعد اعتماد الفائزين انقل
          الدور للتالي.
        </p>
        <Field label="الدور الحالي">
          <select value={currentStage} onChange={(e) => setCurrentStage(e.target.value as Stage)} className="input">
            {meta.stages.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="آخر موعد لتوقع ترتيب المجموعات (KSA)">
          <input type="datetime-local" value={groupsDeadline} onChange={(e) => setGroupsDeadline(e.target.value)} className="input" />
        </Field>
        <Field label="آخر موعد لتوقع البطل (KSA)">
          <input type="datetime-local" value={championDeadline} onChange={(e) => setChampionDeadline(e.target.value)} className="input" />
        </Field>
        <Field label="بطل البطولة (بعد النهائي)">
          <select value={champion} onChange={(e) => setChampion(e.target.value)} className="input">
            <option value="">— لم يُحدد —</option>
            {meta.teams.map((t) => (
              <option key={t.code} value={t.code}>
                {t.flag} {t.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-center gap-2">
          <Button onClick={save} loading={saving}>
            حفظ الإعدادات
          </Button>
          {msg && <span className="text-xs text-muted">{msg}</span>}
        </div>
      </Card>

      <h3 className="pt-2 text-sm font-bold text-navy">إعلان الفائزين (أفضل 3)</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {BOARDS.map((b) => (
          <BoardWinners
            key={b}
            board={b}
            announced={winners.filter((w) => w.board === b)}
            onAnnounced={async () => {
              await loadWinners();
              await reload();
            }}
          />
        ))}
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-line);border-radius:.6rem;padding:.5rem .6rem;font-size:.875rem;background:#fff}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}

function BoardWinners({
  board,
  announced,
  onAnnounced,
}: {
  board: Board;
  announced: WinnerRow[];
  onAnnounced: () => Promise<void>;
}) {
  const [top, setTop] = useState<LeaderRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ rows: LeaderRow[] }>(`/leaderboard?board=${board}`).then((d) => setTop(d.rows.filter((r) => r.rank <= 3)));
  }, [board, announced.length]);

  const announce = async () => {
    if (!confirm(`اعتماد وإعلان الفائزين في ${BOARD_NAMES[board]}؟ سيظهرون لجميع المشاركين.`)) return;
    setBusy(true);
    try {
      await api(`/admin/winners/${board}`, { method: "POST", admin: true });
      await onAnnounced();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-3.5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold">{BOARD_NAMES[board]}</h4>
        <Button variant={announced.length ? "ghost" : "gold"} onClick={announce} loading={busy} className="px-3 py-1 text-xs">
          <Trophy className="size-3.5" /> {announced.length ? "إعادة الاعتماد" : "اعتماد الفائزين"}
        </Button>
      </div>
      {announced.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-lg bg-gold-soft/60 p-2 text-xs">
          {announced.map((w) => (
            <li key={`${w.rank}-${w.participantId}`} className="flex gap-2">
              <b>#{w.rank}</b>
              <span className="flex-1">{w.name}</span>
              <span dir="ltr">{w.phone}</span>
              <b>{w.points}</b>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-muted">المتصدرون حالياً:</p>
      <ul className="text-xs">
        {top === null ? (
          <li>…</li>
        ) : top.length === 0 ? (
          <li className="text-muted">لا يوجد</li>
        ) : (
          top.map((r) => (
            <li key={r.participantId} className="flex gap-2">
              <span>#{r.rank}</span>
              <span className="flex-1">{r.name}</span>
              <span className="text-muted">دقيقة {r.exact}</span>
              <b>{r.points}</b>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

// ---------------- Participants ----------------

function People() {
  const [rows, setRows] = useState<Participant[] | null>(null);
  const [q, setQ] = useState("");
  const load = useCallback(async () => setRows(await api<Participant[]>("/admin/participants", { admin: true })), []);
  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = () => {
    if (!rows) return;
    const head = ["id", "name", "phone", "registered", ...BOARDS.map((b) => BOARD_NAMES[b])];
    const lines = rows.map((r) =>
      [r.id, r.name, r.phone, r.createdAt, ...BOARDS.map((b) => r.boards[b]?.points ?? 0)]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob(["﻿" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tam-cup-participants-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const resetPin = async (p: Participant) => {
    const pin = prompt(`رقم سري جديد (4 أرقام) لـ ${p.name}`);
    if (!pin) return;
    try {
      await api(`/admin/participants/${p.id}/reset-pin`, { method: "POST", admin: true, body: { pin } });
      alert("تم تغيير الرقم السري");
    } catch (e) {
      alert(e instanceof Error ? e.message : "خطأ");
    }
  };

  if (!rows) return <Spinner className="text-brand" />;
  const filtered = rows.filter((r) => !q || r.name.includes(q) || r.phone.includes(q));

  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
          <Search className="size-4 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الجوال" className="w-full text-sm outline-none" />
        </label>
        <Button variant="ghost" onClick={exportCsv}>
          <Download className="size-4" /> CSV
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">عدد المشاركين: {rows.length}</p>
      <Card className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[560px] text-xs">
          <thead className="bg-page/70 text-muted">
            <tr>
              <th className="px-3 py-2 text-right">الاسم</th>
              <th className="px-3 py-2 text-right">الجوال</th>
              {BOARDS.map((b) => (
                <th key={b} className="px-2 py-2">
                  {BOARD_NAMES[b]}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2" dir="ltr">
                  {r.phone}
                </td>
                {BOARDS.map((b) => (
                  <td key={b} className="px-2 py-2 text-center tabular-nums">
                    {r.boards[b]?.points ?? "–"}
                  </td>
                ))}
                <td className="px-2">
                  <button onClick={() => resetPin(r)} className="text-brand" title="إعادة تعيين الرقم السري">
                    <KeyRound className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
