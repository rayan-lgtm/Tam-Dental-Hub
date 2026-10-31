import { ArrowRight, Phone, MessageCircle, Sparkles, AlertCircle, Lightbulb, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useFetch, useRange } from "../hooks";
import { OUTCOME_LABEL, RANGES, SEVERITY_LABEL, fmtDateTime, tone } from "../format";
import type { AgentReport, Channel, Meta } from "../types";
import { Card, CardTitle, ChannelBadge, Empty, ErrorBox, ScorePill, ScoreRing, Segmented, Spinner } from "../components/ui";
import { CriteriaBars, OutcomeBar, TrendChart } from "../components/charts";

export default function AgentPage({ id }: { id: number; meta: Meta }) {
  const { range, setRange, query } = useRange();
  const { data, error, loading } = useFetch<AgentReport>(`/agents/${id}/report?${query}`);
  const [filter, setFilter] = useState<"all" | Channel>("all");
  const [shown, setShown] = useState(20);

  return (
    <div className="space-y-4">
      <a href="#/" className="inline-flex items-center gap-1 text-sm text-brand-dark hover:underline">
        <ArrowRight className="size-4" /> لوحة المتابعة
      </a>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{data?.agent.name ?? "…"}</h1>
          {data?.agent.branch ? <p className="text-sm text-muted">{data.agent.branch}</p> : null}
        </div>
        <Segmented items={RANGES} value={range} onChange={setRange} />
      </div>

      {error ? <ErrorBox message={error} /> : null}
      {!data ? (
        <div className="flex justify-center py-20">{loading ? <Spinner /> : null}</div>
      ) : data.count === 0 ? (
        <Card>
          <Empty>لا توجد تقييمات لهذه الموظفة في الفترة المحددة.</Empty>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="flex flex-col items-center gap-2 py-5">
              <div className="text-sm font-bold">التقييم الشامل</div>
              <ScoreRing score={data.avg} size={130} />
              <div className="text-xs text-muted">
                {data.count} محادثة مقيّمة · {Math.round((data.booked / data.count) * 100)}٪ حجز
              </div>
            </Card>
            <ChannelCard icon={<Phone className="size-5" />} title="المكالمات" stats={data.call} />
            <ChannelCard icon={<MessageCircle className="size-5" />} title="الشات" stats={data.chat} />
          </div>

          <Card>
            <CardTitle>تطور الأداء</CardTitle>
            <TrendChart data={data.daily} target={data.target} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardTitle>المعايير (من 5) — مكالمات مقابل شات</CardTitle>
              <CriteriaBars criteria={data.criteria} />
            </Card>
            <div className="space-y-4">
              <Card>
                <CardTitle>
                  <span className="inline-flex items-center gap-1.5">
                    <Lightbulb className="size-4 text-gold" /> خطة التطوير
                  </span>
                </CardTitle>
                <ol className="mb-3 space-y-1.5 text-sm">
                  {data.focusAreas.map((f, i) => (
                    <li key={f.key} className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-warn/15 text-[11px] font-bold text-warn">
                        {i + 1}
                      </span>
                      <span className="flex-1">{f.label}</span>
                      <span className="tabular text-xs text-muted">{f.all}</span>
                    </li>
                  ))}
                </ol>
                <div className="space-y-2 border-t border-line pt-3">
                  {data.coachingTips.slice(0, 3).map((t) => (
                    <a key={t.id} href={`#/conv/${t.id}`} className="block rounded-lg bg-gold/10 p-2 text-xs leading-relaxed text-ink hover:bg-gold/20">
                      {t.tip}
                    </a>
                  ))}
                </div>
              </Card>
              <Card>
                <CardTitle>نتائج المحادثات</CardTitle>
                <OutcomeBar outcomes={data.outcomes} labels={OUTCOME_LABEL} />
              </Card>
              {data.criticalBreakdown.length ? (
                <Card>
                  <CardTitle>أخطاء حرجة</CardTitle>
                  <ul className="space-y-1.5 text-sm">
                    {data.criticalBreakdown.map((c) => (
                      <li key={c.key} className="flex items-center gap-2">
                        <AlertTriangle className="size-4 shrink-0 text-bad" />
                        <span className="flex-1">{c.label}</span>
                        <b className="tabular text-bad">{c.count}</b>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="size-4 text-good" /> الأمور الممتازة
                </span>
              </CardTitle>
              <ul className="space-y-2">
                {data.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-good" />
                    <a href={`#/conv/${s.id}`} className="hover:underline">
                      {s.text}
                    </a>
                    {s.count > 1 ? <span className="tabular text-xs text-muted">×{s.count}</span> : null}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <CardTitle>
                <span className="inline-flex items-center gap-1.5">
                  <AlertCircle className="size-4 text-warn" /> المشكلات في الردود
                </span>
              </CardTitle>
              {data.issues.length === 0 ? (
                <Empty>لا توجد ملاحظات</Empty>
              ) : (
                <ul className="space-y-3">
                  {data.issues.map((x, i) => (
                    <li key={i} className="text-sm">
                      <a href={`#/conv/${x.id}`} className="block hover:bg-page/60">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{x.title}</span>
                          <SeverityTag severity={x.severity} />
                          {x.count > 1 ? <span className="tabular text-xs text-muted">تكرر {x.count} مرات</span> : <ChannelBadge channel={x.channel} />}
                        </div>
                        <p className="mt-0.5 text-muted">{x.detail}</p>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
              <h3 className="text-sm font-bold">سجل التقييمات</h3>
              <Segmented<"all" | Channel>
                items={[
                  { key: "all", label: "الكل" },
                  { key: "call", label: "مكالمات" },
                  { key: "chat", label: "شات" },
                ]}
                value={filter}
                onChange={setFilter}
              />
            </div>
            <ul className="divide-y divide-line">
              {data.evaluations
                .filter((e) => filter === "all" || e.channel === filter)
                .slice(0, shown)
                .map((e) => (
                  <li key={e.id}>
                    <a href={`#/conv/${e.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-page/60">
                      <ScorePill score={e.overall} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <ChannelBadge channel={e.channel} />
                          <span className="text-muted">{fmtDateTime(e.occurredAt)}</span>
                          {e.customer ? <span className="text-muted">· {e.customer}</span> : null}
                          <span className="rounded bg-page px-1.5 py-0.5 text-muted">{OUTCOME_LABEL[e.outcome] ?? e.outcome}</span>
                          {e.criticalFlags.length ? <span className="text-bad">⚠ خطأ حرج</span> : null}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted">{e.summary}</p>
                      </div>
                    </a>
                  </li>
                ))}
            </ul>
            {data.evaluations.filter((e) => filter === "all" || e.channel === filter).length > shown ? (
              <button onClick={() => setShown((n) => n + 30)} className="w-full border-t border-line py-3 text-sm font-semibold text-brand-dark hover:bg-page">
                عرض المزيد
              </button>
            ) : null}
          </Card>
        </>
      )}
    </div>
  );
}

function ChannelCard({ icon, title, stats }: { icon: React.ReactNode; title: string; stats: AgentReport["call"] }) {
  const t = tone(stats.avg);
  return (
    <Card className={`flex flex-col justify-between ${t.soft}`}>
      <div className="flex items-center gap-2 text-sm font-bold">
        <span className={t.text}>{icon}</span>
        {title}
      </div>
      <div className={`tabular mt-3 text-4xl font-bold ${t.text}`}>{stats.avg ?? "—"}</div>
      <div className="mt-2 flex gap-3 text-xs text-muted">
        <span>{stats.count} عينة</span>
        <span>{stats.booked} حجز</span>
        {stats.critical ? <span className="text-bad">{stats.critical} خطأ حرج</span> : null}
      </div>
    </Card>
  );
}

export function SeverityTag({ severity }: { severity: "low" | "medium" | "high" }) {
  const cls = { high: "bg-bad/10 text-bad", medium: "bg-warn/10 text-warn", low: "bg-page text-muted" }[severity];
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${cls}`}>خطورة {SEVERITY_LABEL[severity]}</span>;
}
