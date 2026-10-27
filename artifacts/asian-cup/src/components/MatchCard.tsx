import { useEffect, useState } from "react";
import { Check, Lock, MapPin, Minus, Plus, Clock } from "lucide-react";
import { api } from "../api";
import { now, useApp } from "../store";
import { fmtTime, fmtDay } from "../format";
import type { Match } from "../types";
import { Button, Flag, PointsBadge } from "./ui";

const STAGE_SHORT: Record<string, string> = {
  r16: "دور الـ16",
  qf: "ربع النهائي",
  sf: "نصف النهائي",
  final: "النهائي 🏆",
};

export function MatchCard({ match, showDay = false }: { match: Match; showDay?: boolean }) {
  const { me, team, refresh } = useApp();
  const pred = me.predictions.find((p) => p.matchId === match.id);
  const [home, setHome] = useState<number | null>(pred?.homeScore ?? null);
  const [away, setAway] = useState<number | null>(pred?.awayScore ?? null);
  const [qualifier, setQualifier] = useState<string | null>(pred?.qualifier ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setHome(pred?.homeScore ?? null);
    setAway(pred?.awayScore ?? null);
    setQualifier(pred?.qualifier ?? null);
  }, [pred?.homeScore, pred?.awayScore, pred?.qualifier]);

  const H = team(match.homeTeam);
  const A = team(match.awayTeam);
  const knockout = match.stage !== "group";
  const started = new Date(match.kickoff).getTime() <= now();
  const teamsKnown = !!H && !!A;
  const locked = match.finished || started || !teamsKnown;
  const isDraw = home !== null && away !== null && home === away;
  const needsQualifier = knockout && isDraw;
  const dirty =
    home !== null &&
    away !== null &&
    (home !== pred?.homeScore || away !== pred?.awayScore || (needsQualifier && qualifier !== pred?.qualifier));
  const canSave = dirty && (!needsQualifier || qualifier === match.homeTeam || qualifier === match.awayTeam);

  const setSide = (side: "home" | "away") => (v: number) => {
    if (side === "home") setHome(v);
    else setAway(v);
    if (side === "home" && away === null) setAway(0);
    if (side === "away" && home === null) setHome(0);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api(`/predictions/${match.id}`, {
        method: "PUT",
        body: { homeScore: home, awayScore: away, qualifier: needsQualifier ? qualifier : null },
      });
      await refresh();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const label = match.groupLetter
    ? `المجموعة ${match.groupLetter} • الجولة ${match.round}`
    : `${STAGE_SHORT[match.stage]} • مباراة ${match.id}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(13,27,42,0.04)]">
      <div className="flex items-center justify-between border-b border-line/70 bg-page/50 px-4 py-2 text-[11px] text-muted">
        <span className="font-semibold text-brand-dark">{label}</span>
        <span className="flex items-center gap-1">
          <MapPin className="size-3" />
          {match.city}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 px-3 pb-3 pt-4">
        <TeamSide
          name={H?.name ?? match.homeLabel}
          known={!!H}
          flag={<Flag team={H} size="lg" />}
          value={home}
          onChange={setSide("home")}
          editable={!locked}
        />

        <div className="flex min-w-20 flex-col items-center pt-2 text-center">
          {match.finished ? (
            <>
              <span className="text-[10px] font-semibold text-muted">النتيجة</span>
              <Score home={match.homeScore!} away={match.awayScore!} className="text-2xl font-bold text-navy" />
              {knockout && match.qualifier && match.homeScore === match.awayScore && (
                <span className="mt-0.5 text-[10px] text-muted">تأهل {team(match.qualifier)?.name}</span>
              )}
            </>
          ) : (
            <>
              <span className="text-lg font-bold tabular-nums text-navy">{fmtTime(match.kickoff)}</span>
              {showDay && <span className="text-[10px] text-muted">{fmtDay(match.kickoff)}</span>}
              {started && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                  <span className="size-1.5 animate-pulse rounded-full bg-red-500" /> جارية
                </span>
              )}
            </>
          )}
        </div>

        <TeamSide
          name={A?.name ?? match.awayLabel}
          known={!!A}
          flag={<Flag team={A} size="lg" />}
          value={away}
          onChange={setSide("away")}
          editable={!locked}
        />
      </div>

      {!locked && needsQualifier && (
        <div className="px-4 pb-3">
          <p className="mb-2 text-center text-xs text-muted">توقعت تعادلاً.. مين يتأهل؟ (+2 نقطة)</p>
          <div className="grid grid-cols-2 gap-2">
            {[H, A].map((t) => (
              <button
                key={t!.code}
                onClick={() => setQualifier(t!.code)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-medium transition ${
                  qualifier === t!.code ? "border-brand bg-brand-soft/60 text-brand-dark" : "border-line text-muted"
                }`}
              >
                <Flag team={t} size="sm" /> {t!.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="border-t border-line/70 px-4 py-2.5 text-xs">
        {!teamsKnown ? (
          <p className="flex items-center justify-center gap-1.5 text-muted">
            <Clock className="size-3.5" /> بانتظار تحديد المتأهلين
          </p>
        ) : !locked ? (
          <div className="flex items-center justify-between gap-2">
            <span className={`flex items-center gap-1 ${error ? "text-red-600" : "text-muted"}`}>
              {error ??
                (justSaved ? (
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <Check className="size-3.5" /> تم حفظ توقعك
                  </span>
                ) : pred && !dirty ? (
                  <span className="flex items-center gap-1 text-emerald-700">
                    <Check className="size-3.5" /> توقعك محفوظ ويمكن تعديله حتى صافرة البداية
                  </span>
                ) : (
                  "توقّع النتيجة قبل بداية المباراة"
                ))}
            </span>
            {dirty && (
              <Button onClick={save} loading={saving} disabled={!canSave} className="shrink-0 px-3 py-1.5 text-xs">
                حفظ
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-muted">
              <Lock className="size-3.5" />
              {pred ? (
                <>
                  توقعك:{" "}
                  <Score home={pred.homeScore} away={pred.awayScore} className="font-bold text-ink" />
                  {knockout && pred.qualifier && pred.homeScore === pred.awayScore && (
                    <> (تأهل {team(pred.qualifier)?.name})</>
                  )}
                </>
              ) : (
                "لم تتوقع هذه المباراة"
              )}
            </span>
            {pred?.score && <PointsBadge points={pred.score.points} />}
          </div>
        )}
      </footer>
    </article>
  );
}

function TeamSide({
  name,
  known,
  flag,
  value,
  onChange,
  editable,
}: {
  name: string;
  known: boolean;
  flag: React.ReactNode;
  value: number | null;
  onChange: (v: number) => void;
  editable: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      {known ? flag : <span className="flex size-10 items-center justify-center rounded-full bg-page text-lg text-brand-light">?</span>}
      <span className={`line-clamp-2 min-h-8 text-[13px] font-semibold leading-4 ${known ? "text-ink" : "text-muted"}`}>
        {name}
      </span>
      {editable && (
        <div className="mt-1 flex items-center gap-1.5">
          <button
            aria-label="نقص"
            onClick={() => onChange(Math.max(0, (value ?? 0) - 1))}
            className="flex size-8 items-center justify-center rounded-full bg-page text-muted active:bg-brand-soft"
          >
            <Minus className="size-4" />
          </button>
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold tabular-nums ${
              value === null ? "border border-dashed border-brand-light text-brand-light" : "bg-navy text-white"
            }`}
          >
            {value ?? "–"}
          </span>
          <button
            aria-label="زد"
            onClick={() => onChange(Math.min(20, (value ?? -1) + 1))}
            className="flex size-8 items-center justify-center rounded-full bg-page text-muted active:bg-brand-soft"
          >
            <Plus className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Home score sits on the right (same side as the home team in RTL). */
function Score({ home, away, className = "" }: { home: number; away: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 tabular-nums ${className}`}>
      <span>{home}</span>
      <span className="opacity-50">-</span>
      <span>{away}</span>
    </span>
  );
}
