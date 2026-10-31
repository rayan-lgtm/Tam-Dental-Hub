import { Phone, MessageCircle, ClipboardCheck, AlertTriangle, CalendarCheck, Target, ChevronLeft } from "lucide-react";
import { useFetch, useRange } from "../hooks";
import { OUTCOME_LABEL, RANGES, fmtDateTime, tone } from "../format";
import type { Meta, Overview } from "../types";
import { Card, CardTitle, ChannelBadge, Empty, ErrorBox, ScorePill, ScoreRing, Segmented, Spinner, Stat } from "../components/ui";
import { CriteriaBars, OutcomeBar, TrendChart } from "../components/charts";

export default function Dashboard({ meta }: { meta: Meta }) {
  const { range, setRange, query } = useRange();
  const { data, error, loading } = useFetch<Overview>(`/overview?${query}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">لوحة متابعة الأداء</h1>
          <p className="text-sm text-muted">مستوى الخدمة والضيافة لفريق الاتصال والشات — الهدف العالمي {meta.target}+</p>
        </div>
        <Segmented items={RANGES} value={range} onChange={setRange} />
      </div>

      {error ? <ErrorBox message={error} /> : null}
      {!data ? (
        <div className="flex justify-center py-20">{loading ? <Spinner /> : null}</div>
      ) : data.team.count === 0 ? (
        <Card>
          <Empty>
            لا توجد تقييمات في هذه الفترة. أضف محادثة من «تقييم محادثة»، أو حمّل بيانات تجريبية من «الإعدادات» لاستعراض اللوحة.
          </Empty>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <Card className="flex flex-col items-center justify-center gap-3 py-6">
              <div className="text-sm font-bold">التقييم العام للفريق</div>
              <ScoreRing score={data.team.avg} size={140} />
              <div className="grid w-full grid-cols-2 gap-2 text-center">
                <ChannelScore icon={<Phone className="size-4" />} label="المكالمات" score={data.team.call.avg} count={data.team.call.count} />
                <ChannelScore icon={<MessageCircle className="size-4" />} label="الشات" score={data.team.chat.avg} count={data.team.chat.count} />
              </div>
            </Card>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="محادثات مُقيّمة" value={data.team.count} icon={<ClipboardCheck className="size-5" />} />
                <Stat
                  label="نسبة الحجز"
                  value={`${Math.round((data.team.booked / data.team.count) * 100)}٪`}
                  sub={`${data.team.booked} حجز`}
                  icon={<CalendarCheck className="size-5" />}
                />
                <Stat
                  label="أخطاء حرجة"
                  value={data.team.critical}
                  sub={data.team.critical ? "تحتاج مراجعة فورية" : "لا يوجد"}
                  icon={<AlertTriangle className="size-5" />}
                />
                <Stat
                  label="موظفات فوق الهدف"
                  value={`${data.agents.filter((a) => (a.avg ?? 0) >= data.target).length} / ${data.agents.filter((a) => a.count).length}`}
                  sub={`الهدف ${data.target}`}
                  icon={<Target className="size-5" />}
                />
              </div>
              <Card>
                <CardTitle>اتجاه الأداء اليومي</CardTitle>
                <TrendChart data={data.daily} target={data.target} />
              </Card>
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="p-4 pb-2">
              <CardTitle>تقييم الموظفات</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-page text-xs text-muted">
                  <tr>
                    <th className="px-4 py-2 text-start font-semibold">#</th>
                    <th className="px-2 py-2 text-start font-semibold">الموظفة</th>
                    <th className="px-2 py-2 text-center font-semibold">الشامل</th>
                    <th className="px-2 py-2 text-center font-semibold">المكالمات</th>
                    <th className="px-2 py-2 text-center font-semibold">الشات</th>
                    <th className="px-2 py-2 text-center font-semibold">العينات</th>
                    <th className="px-2 py-2 text-start font-semibold">أقوى نقطة</th>
                    <th className="px-2 py-2 text-start font-semibold">أولوية التطوير</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.agents.map((a, i) => (
                    <tr
                      key={a.id}
                      onClick={() => (window.location.hash = `/agent/${a.id}`)}
                      className="cursor-pointer border-t border-line hover:bg-page/60"
                    >
                      <td className="tabular px-4 py-2.5 text-muted">{i + 1}</td>
                      <td className="px-2 py-2.5">
                        <div className="font-semibold">{a.name}</div>
                        {a.branch ? <div className="text-[11px] text-muted">{a.branch}</div> : null}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <ScorePill score={a.avg} />
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <ScorePill score={a.call.avg} />
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <ScorePill score={a.chat.avg} />
                      </td>
                      <td className="tabular px-2 py-2.5 text-center text-muted">
                        {a.call.count} / {a.chat.count}
                        {a.critical ? <span className="ms-1 text-bad">⚠ {a.critical}</span> : null}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-good">{a.strongest ?? "—"}</td>
                      <td className="px-2 py-2.5 text-xs text-warn">{a.weakest ?? "—"}</td>
                      <td className="px-2 text-muted">
                        <ChevronLeft className="size-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 text-[11px] text-muted">العينات: مكالمات / شات</div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardTitle>متوسط المعايير (من 5)</CardTitle>
              <CriteriaBars criteria={data.criteria} />
            </Card>
            <div className="space-y-4">
              <Card>
                <CardTitle>أولويات التدريب للفريق</CardTitle>
                <ol className="space-y-2">
                  {data.focusAreas.map((f, i) => (
                    <li key={f.key} className="flex items-center gap-2 text-sm">
                      <span className="flex size-6 items-center justify-center rounded-full bg-warn/15 text-xs font-bold text-warn">
                        {i + 1}
                      </span>
                      <span className="flex-1">{f.label}</span>
                      <span className="tabular text-xs text-muted">{f.all} / 5</span>
                    </li>
                  ))}
                </ol>
              </Card>
              <Card>
                <CardTitle>نتائج المحادثات</CardTitle>
                <OutcomeBar outcomes={data.outcomes} labels={OUTCOME_LABEL} />
              </Card>
              {data.criticalBreakdown.length ? (
                <Card>
                  <CardTitle>الأخطاء الحرجة</CardTitle>
                  <ul className="space-y-1.5 text-sm">
                    {data.criticalBreakdown.map((c) => (
                      <li key={c.key} className="flex items-center gap-2">
                        <AlertTriangle className="size-4 shrink-0 text-bad" />
                        <span className="flex-1">{c.label}</span>
                        <span className="tabular font-bold text-bad">{c.count}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <EvalList title="محادثات تحتاج مراجعة (الأقل تقييماً)" items={data.lowest} />
            <EvalList title="نماذج يُحتذى بها (الأعلى تقييماً)" items={data.best} />
          </div>
        </>
      )}
    </div>
  );
}

function ChannelScore({ icon, label, score, count }: { icon: React.ReactNode; label: string; score: number | null; count: number }) {
  const t = tone(score);
  return (
    <div className={`rounded-xl p-2 ${t.soft}`}>
      <div className="flex items-center justify-center gap-1 text-xs text-muted">
        {icon}
        {label}
      </div>
      <div className={`tabular text-xl font-bold ${t.text}`}>{score ?? "—"}</div>
      <div className="text-[10px] text-muted">{count} عينة</div>
    </div>
  );
}

export function EvalList({ title, items }: { title: string; items: Overview["lowest"] }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {items.length === 0 ? (
        <Empty>لا يوجد</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((e) => (
            <li key={e.id}>
              <a href={`#/conv/${e.id}`} className="flex items-start gap-3 py-2.5 hover:bg-page/60">
                <ScorePill score={e.overall} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-ink">{e.agentName}</span>
                    <ChannelBadge channel={e.channel} />
                    <span className="text-muted">{fmtDateTime(e.occurredAt)}</span>
                    {e.criticalFlags.length ? <span className="text-bad">⚠ خطأ حرج</span> : null}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">{e.summary}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
