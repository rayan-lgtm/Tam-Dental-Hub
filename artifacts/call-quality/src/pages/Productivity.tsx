import { useState } from "react";
import { CalendarCheck, UserCheck, UserX, Ban, Globe, AlertTriangle, PhoneIncoming, Info } from "lucide-react";
import { useFetch, useRange } from "../hooks";
import { RANGES, fmtDay, tone } from "../format";
import type { Productivity as P, ProductivityRow, Team } from "../types";
import { Card, CardTitle, Empty, ErrorBox, ScorePill, Segmented, Spinner, Stat } from "../components/ui";

export const TEAM_LABEL: Record<Team, string> = { sales: "المبيعات", organic: "خدمة العملاء" };

const TEAMS: { key: "all" | Team; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "sales", label: "المبيعات" },
  { key: "organic", label: "خدمة العملاء" },
];

export default function Productivity() {
  const { range, setRange, query } = useRange();
  const [team, setTeam] = useState<"all" | Team>("all");
  const { data, error, loading } = useFetch<P>(`/productivity?${query}${team === "all" ? "" : `&team=${team}`}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">الإنتاجية والحجوزات</h1>
          <p className="text-sm text-muted">من التواصل الوارد إلى الحجز إلى حضور المراجع — لكل موظفة</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Segmented<"all" | Team> items={TEAMS} value={team} onChange={setTeam} />
          <Segmented items={RANGES} value={range} onChange={setRange} />
        </div>
      </div>

      {error ? <ErrorBox message={error} /> : null}
      {!data ? (
        <div className="flex justify-center py-20">{loading ? <Spinner /> : null}</div>
      ) : data.totals.bookings === 0 && data.agents.length === 0 ? (
        <Card>
          <Empty>لا توجد حجوزات في هذه الفترة. شغّل مزامنة GHL من الإعدادات، أو حمّل البيانات التجريبية.</Empty>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Stat label="الحجوزات" value={data.totals.bookings} sub={`${data.totals.upcoming} موعد قادم`} icon={<CalendarCheck className="size-5" />} />
            <Stat label="حضر" value={data.totals.showed} sub={data.totals.showRate != null ? `نسبة الحضور ${data.totals.showRate}٪` : undefined} icon={<UserCheck className="size-5" />} />
            <Stat label="لم يحضر" value={data.totals.noshow} sub={data.totals.noshowRate != null ? `${data.totals.noshowRate}٪ من المواعيد المنتهية` : undefined} icon={<UserX className="size-5" />} />
            <Stat label="ألغى" value={data.totals.cancelled} sub={data.totals.cancelRate != null ? `${data.totals.cancelRate}٪ من الحجوزات` : undefined} icon={<Ban className="size-5" />} />
            <Stat
              label="التواصل الوارد"
              value={data.staff.contacts ?? "—"}
              sub={data.staff.conversion != null ? `تحويل إلى حجز ${data.staff.conversion}٪` : "غير مربوط بعد"}
              icon={<PhoneIncoming className="size-5" />}
            />
            <Stat label="حجز أونلاين" value={data.online.bookings} sub="المراجع حجز بنفسه" icon={<Globe className="size-5" />} />
          </div>

          {data.unassigned.bookings > 0 ? (
            <div className="flex items-start gap-2 rounded-2xl border border-warn/30 bg-warn/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
              <div>
                <b className="tabular">{data.unassigned.bookings}</b> حجز ({data.unassigned.share}٪) بدون اسم موظفة — حجزتها موظفات
                موجودات في DentalTap وليس لهن حساب في GHL. أضف حساباتهن في GHL لتُنسب حجوزاتهن لهن.
              </div>
            </div>
          ) : null}

          <Card className="overflow-hidden p-0">
            <div className="p-4 pb-2">
              <CardTitle>جدوى كل موظفة</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-page text-xs text-muted">
                  <tr>
                    <th className="px-4 py-2 text-start font-semibold">الموظفة</th>
                    <th className="px-2 py-2 text-center font-semibold">مكالمات واردة</th>
                    <th className="px-2 py-2 text-center font-semibold">شات وارد</th>
                    <th className="px-2 py-2 text-center font-semibold">حجوزات</th>
                    <th className="px-2 py-2 text-center font-semibold">حضر</th>
                    <th className="px-2 py-2 text-center font-semibold">لم يحضر</th>
                    <th className="px-2 py-2 text-center font-semibold">ألغى</th>
                    <th className="px-2 py-2 text-center font-semibold">قادم</th>
                    <th className="px-2 py-2 text-center font-semibold">نسبة الحضور</th>
                    <th className="px-2 py-2 text-center font-semibold">تحويل التواصل لحجز</th>
                    <th className="px-2 py-2 text-center font-semibold">جودة المحادثات</th>
                    <th className="px-4 py-2 text-start font-semibold">المسار</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agents.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => (window.location.hash = `/agent/${a.id}`)}
                      className="cursor-pointer border-t border-line hover:bg-page/60"
                    >
                      <td className="px-4 py-2.5">
                        <div className="font-semibold">{a.name}</div>
                        {a.team ? <div className="text-[11px] text-muted">{TEAM_LABEL[a.team]}</div> : null}
                      </td>
                      <Num v={a.calls} />
                      <Num v={a.chats} />
                      <Num v={a.bookings} bold />
                      <Num v={a.showed} className="text-good" />
                      <Num v={a.noshow} className="text-bad" />
                      <Num v={a.cancelled} className="text-warn" />
                      <Num v={a.upcoming} className="text-muted" />
                      <td className="px-2 py-2.5 text-center">
                        <RatePill v={a.showRate} good={85} ok={70} />
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <RatePill v={a.conversion} good={25} ok={15} />
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <ScorePill score={a.qa} />
                      </td>
                      <td className="px-4 py-2.5">
                        <FunnelBar row={a} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2 text-[11px] text-muted">
              <span>نسبة الحضور = حضر ÷ (حضر + لم يحضر)</span>
              <span>تحويل التواصل = الحجوزات ÷ (المكالمات + الشات الوارد)</span>
              <span>الحجوزات محسوبة بتاريخ إنشاء الحجز، وحالتها من GHL</span>
            </div>
          </Card>

          {!data.volumeConnected ? (
            <div className="flex items-start gap-2 rounded-2xl bg-brand/5 p-3 text-sm text-ink">
              <Info className="mt-0.5 size-4 shrink-0 text-brand" />
              أعداد المكالمات والشات الواردة ستظهر بعد ربط اتصالنا وrespond.io (عبر Zapier إلى ‎/api/qa/volume‎). الحجوزات
              والحضور تعمل الآن من GHL.
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardTitle>الحجوزات اليومية ونتيجتها</CardTitle>
              <DailyBars data={data.daily} />
            </Card>
            <Card>
              <CardTitle>مصادر الحجز</CardTitle>
              <SourceSplit data={data} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Num({ v, bold, className = "" }: { v: number | null; bold?: boolean; className?: string }) {
  return <td className={`tabular px-2 py-2.5 text-center ${bold ? "font-bold" : ""} ${className}`}>{v ?? "—"}</td>;
}

function RatePill({ v, good, ok }: { v: number | null; good: number; ok: number }) {
  if (v == null) return <span className="text-muted">—</span>;
  const cls = v >= good ? "bg-good/10 text-good" : v >= ok ? "bg-brand/10 text-brand-dark" : "bg-bad/10 text-bad";
  return <span className={`tabular inline-flex min-w-11 justify-center rounded-lg px-2 py-0.5 text-sm font-bold ${cls}`}>{v}٪</span>;
}

/** Stacked bar of the agent's bookings by outcome. */
export function FunnelBar({ row }: { row: Pick<ProductivityRow, "bookings" | "showed" | "noshow" | "cancelled" | "upcoming"> }) {
  if (!row.bookings) return <span className="text-xs text-muted">—</span>;
  const seg = (n: number, color: string, label: string) =>
    n ? <div title={`${label}: ${n}`} style={{ width: `${(n / row.bookings) * 100}%`, background: color }} /> : null;
  return (
    <div className="flex h-2.5 w-36 overflow-hidden rounded-full bg-page">
      {seg(row.showed, "#1f9d6b", "حضر")}
      {seg(row.upcoming, "#87b3d4", "قادم")}
      {seg(row.noshow, "#d64545", "لم يحضر")}
      {seg(row.cancelled, "#d98a12", "ألغى")}
    </div>
  );
}

function DailyBars({ data }: { data: P["daily"] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!data.length) return <Empty>لا توجد بيانات</Empty>;
  const max = Math.max(...data.map((d) => d.bookings), 1);
  const h = hover != null ? data[hover] : null;
  return (
    <div>
      <div className="mb-2 flex min-h-5 flex-wrap items-center gap-3 text-xs text-muted">
        <Legend color="#1f9d6b" label="حضر" />
        <Legend color="#87b3d4" label="قادم" />
        <Legend color="#d64545" label="لم يحضر" />
        <Legend color="#d98a12" label="ألغى" />
        {h ? (
          <span className="ms-auto text-ink">
            {fmtDay(h.day)} — <b className="tabular">{h.bookings}</b> حجز · حضر <b className="tabular">{h.showed}</b>
            {h.contacts ? <> · تواصل <b className="tabular">{h.contacts}</b></> : null}
          </span>
        ) : null}
      </div>
      <div className="flex h-44 items-end gap-[3px]" onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <div key={d.day} className="flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)}>
            <div
              className={`flex flex-col-reverse overflow-hidden rounded-t ${hover === i ? "opacity-100" : "opacity-85"}`}
              style={{ height: `${(d.bookings / max) * 100}%` }}
            >
              {[
                [d.showed, "#1f9d6b"],
                [d.upcoming, "#87b3d4"],
                [d.noshow, "#d64545"],
                [d.cancelled, "#d98a12"],
              ].map(([n, c]) =>
                n ? <div key={c as string} style={{ height: `${((n as number) / d.bookings) * 100}%`, background: c as string }} /> : null,
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>{fmtDay(data[0]!.day)}</span>
        <span>{fmtDay(data[data.length - 1]!.day)}</span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function SourceSplit({ data }: { data: P }) {
  const staff = data.totals.bookings - data.online.bookings - data.unassigned.bookings;
  const items = [
    { label: "موظفات", n: staff, color: "#1691d0" },
    { label: "بدون اسم (غير مضافات في GHL)", n: data.unassigned.bookings, color: "#d98a12" },
    { label: "حجز أونلاين", n: data.online.bookings, color: "#26717e" },
  ];
  const total = Math.max(1, data.totals.bookings);
  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full">
        {items.map((i) => (i.n ? <div key={i.label} style={{ width: `${(i.n / total) * 100}%`, background: i.color }} /> : null))}
      </div>
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-2 text-sm">
          <span className="size-2.5 rounded-sm" style={{ background: i.color }} />
          <span className="flex-1">{i.label}</span>
          <span className="tabular font-semibold">{i.n}</span>
          <span className="tabular w-10 text-end text-xs text-muted">{Math.round((i.n / total) * 100)}٪</span>
        </div>
      ))}
      <div className="border-t border-line pt-3 text-xs text-muted">
        حضور الحجز الأونلاين: <b className={tone(data.online.showRate).text}>{data.online.showRate ?? "—"}٪</b>
      </div>
    </div>
  );
}
