import { useMemo, useState } from "react";
import { useApp, now } from "../store";
import { Chips } from "../components/ui";
import { MatchCard } from "../components/MatchCard";
import { dayKey, fmtDay } from "../format";
import type { Stage } from "../types";

export default function Matches() {
  const { meta, matches, me } = useApp();
  const [stage, setStage] = useState<Stage>(meta.settings.currentStage);
  const [filter, setFilter] = useState<"all" | "todo">("all");

  const predicted = useMemo(() => new Set(me.predictions.map((p) => p.matchId)), [me.predictions]);

  const items = meta.stages.map((s) => {
    const open = matches.filter(
      (m) =>
        m.stage === s.id &&
        m.homeTeam &&
        m.awayTeam &&
        !m.finished &&
        new Date(m.kickoff).getTime() > now() &&
        !predicted.has(m.id),
    ).length;
    return {
      id: s.id,
      label: s.name,
      badge: open ? (
        <span className="rounded-full bg-gold px-1.5 text-[10px] font-bold leading-4 text-navy">{open}</span>
      ) : undefined,
    };
  });

  const list = matches
    .filter((m) => m.stage === stage)
    .filter(
      (m) =>
        filter === "all" ||
        (!predicted.has(m.id) && !m.finished && m.homeTeam && new Date(m.kickoff).getTime() > now()),
    )
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff) || a.id - b.id);

  const days = new Map<string, typeof list>();
  for (const m of list) {
    const k = dayKey(m.kickoff);
    days.set(k, [...(days.get(k) ?? []), m]);
  }

  const pts = meta.stages.find((s) => s.id === stage)!;

  return (
    <div>
      <Chips items={items} value={stage} onChange={(v) => setStage(v)} />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted">
          الفائز/التعادل <b className="text-navy">{pts.outcome}</b> نقاط • النتيجة الدقيقة{" "}
          <b className="text-navy">{pts.exact}</b> نقاط
          {stage !== "group" && <> • المتأهل +{meta.rules.qualifierBonus}</>}
        </p>
        <button
          onClick={() => setFilter(filter === "all" ? "todo" : "all")}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            filter === "todo" ? "bg-brand text-white" : "bg-brand-soft/60 text-brand-dark"
          }`}
        >
          {filter === "todo" ? "عرض الكل" : "غير المتوقعة"}
        </button>
      </div>

      {list.length === 0 && (
        <p className="mt-12 text-center text-sm text-muted">
          {filter === "todo" ? "أحسنت! توقعت كل المباريات المتاحة 👏" : "لا توجد مباريات"}
        </p>
      )}

      {[...days.entries()].map(([k, ms]) => (
        <section key={k}>
          <h3 className="mb-2 mt-5 text-[13px] font-bold text-navy">{fmtDay(ms[0]!.kickoff)}</h3>
          <div className="space-y-3">
            {ms.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
