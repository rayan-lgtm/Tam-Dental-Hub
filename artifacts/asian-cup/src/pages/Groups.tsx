import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Check, Crown, Lock } from "lucide-react";
import { api } from "../api";
import { now, useApp } from "../store";
import { Button, Card, Flag, PointsBadge, SectionTitle } from "../components/ui";
import { countdown, fmtDateTime } from "../format";

export default function Groups() {
  const { meta } = useApp();
  const groupsDeadline = new Date(meta.settings.groupsDeadline).getTime();
  const groupsLocked = groupsDeadline <= now();

  return (
    <div>
      <ChampionPicker />

      <SectionTitle>توقع ترتيب المجموعات</SectionTitle>
      <Card className="mb-3 p-3.5 text-xs leading-relaxed text-muted">
        رتّب منتخبات كل مجموعة من الأول إلى الرابع. لكل منتخب:{" "}
        <b className="text-navy">{meta.rules.groupPositionPoints[0]}</b> نقاط للمركز الصحيح،{" "}
        <b className="text-navy">{meta.rules.groupPositionPoints[1]}</b> لفرق مركز واحد،{" "}
        <b className="text-navy">{meta.rules.groupPositionPoints[2]}</b> لفرق مركزين. هذه مسابقة مستقلة لها فائزيها.
        <span className={`mt-2 flex items-center gap-1 font-semibold ${groupsLocked ? "text-red-600" : "text-brand-dark"}`}>
          {groupsLocked ? <Lock className="size-3.5" /> : null}
          {groupsLocked
            ? "أُغلق التوقع"
            : `يُغلق التوقع ${fmtDateTime(meta.settings.groupsDeadline)} (باقي ${countdown(groupsDeadline - now())})`}
        </span>
      </Card>
      <div className="space-y-3">
        {meta.groups.map((g) => (
          <GroupEditor key={g} group={g} locked={groupsLocked} />
        ))}
      </div>
    </div>
  );
}

function ChampionPicker() {
  const { meta, me, refresh } = useApp();
  const [pick, setPick] = useState<string | null>(me.champion);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deadline = new Date(meta.settings.championDeadline).getTime();
  const locked = deadline <= now();

  useEffect(() => setPick(me.champion), [me.champion]);

  const save = async () => {
    if (!pick) return;
    setSaving(true);
    setError(null);
    try {
      await api("/champion", { method: "PUT", body: { team: pick } });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-bl from-navy to-teal p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <Crown className="size-4 text-gold" /> مين بطل آسيا 2027؟
          </p>
          <p className="mt-0.5 text-[11px] text-white/70">
            {meta.rules.championBonus} نقطة في الترتيب العام •{" "}
            {locked ? "أُغلق الاختيار" : `يُغلق ${fmtDateTime(meta.settings.championDeadline)}`}
          </p>
        </div>
        {me.championCorrect === true && <PointsBadge points={meta.rules.championBonus} />}
      </div>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {meta.teams.map((t) => {
          const active = pick === t.code;
          return (
            <button
              key={t.code}
              disabled={locked}
              onClick={() => setPick(t.code)}
              className={`flex w-[68px] shrink-0 flex-col items-center gap-1 rounded-xl py-2 text-[11px] transition ${
                active ? "bg-white text-navy ring-2 ring-gold" : "bg-white/10 text-white/85"
              } ${locked && !active ? "opacity-40" : ""}`}
            >
              <span className="text-2xl leading-none">{t.flag}</span>
              <span className="line-clamp-1 px-1">{t.name}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-red-200">{error}</p>}
      {!locked && pick !== me.champion && (
        <Button variant="gold" onClick={save} loading={saving} className="mt-3 w-full">
          تثبيت اختيار البطل
        </Button>
      )}
      {me.champion && pick === me.champion && (
        <p className="mt-3 flex items-center gap-1 text-xs text-white/80">
          <Check className="size-3.5 text-gold" /> اخترت {meta.teams.find((t) => t.code === me.champion)?.name}
        </p>
      )}
    </div>
  );
}

function GroupEditor({ group, locked }: { group: string; locked: boolean }) {
  const { meta, me, team, refresh } = useApp();
  const saved = me.groupPredictions.find((g) => g.group === group);
  const defaultOrder = meta.teams.filter((t) => t.group === group).map((t) => t.code);
  const [order, setOrder] = useState<string[]>(saved?.teams ?? defaultOrder);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (saved) setOrder(saved.teams);
  }, [saved?.teams.join()]);

  const dirty = !saved || saved.teams.join() !== order.join();

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setOrder(next);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api(`/group-predictions/${group}`, { method: "PUT", body: { teams: order } });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-navy">المجموعة {group}</h3>
        {saved?.points != null ? (
          <PointsBadge points={saved.points} />
        ) : saved && !dirty ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <Check className="size-3.5" /> محفوظ
          </span>
        ) : null}
      </div>
      <ol className="space-y-1.5">
        {order.map((code, i) => {
          const t = team(code);
          return (
            <li key={code} className="flex items-center gap-2.5 rounded-xl bg-page/70 px-2.5 py-2">
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  i < 2 ? "bg-brand text-white" : "bg-white text-muted ring-1 ring-line"
                }`}
              >
                {i + 1}
              </span>
              <Flag team={t} size="sm" />
              <span className="flex-1 text-sm font-medium">{t?.name}</span>
              {!locked && (
                <span className="flex gap-1">
                  <button
                    aria-label="أعلى"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="rounded-lg bg-white p-1.5 text-brand ring-1 ring-line disabled:opacity-30"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    aria-label="أسفل"
                    disabled={i === order.length - 1}
                    onClick={() => move(i, 1)}
                    className="rounded-lg bg-white p-1.5 text-brand ring-1 ring-line disabled:opacity-30"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {!locked && dirty && (
        <Button onClick={save} loading={saving} className="mt-3 w-full py-2">
          حفظ ترتيب المجموعة {group}
        </Button>
      )}
    </Card>
  );
}
