import { ChevronRight } from "lucide-react";
import { useApp } from "../store";
import { Card, SectionTitle } from "../components/ui";

export default function Rules() {
  const { meta, go } = useApp();
  const gp = meta.rules.groupPositionPoints;
  return (
    <div className="pb-6">
      <button onClick={() => go("home")} className="flex items-center gap-1 text-xs font-semibold text-brand">
        <ChevronRight className="size-4" /> رجوع
      </button>

      <SectionTitle>نقاط توقع المباريات</SectionTitle>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-page/70 text-[11px] text-muted">
            <tr>
              <th className="px-3 py-2 text-right font-semibold">الدور</th>
              <th className="px-3 py-2 font-semibold">الفائز/التعادل</th>
              <th className="px-3 py-2 font-semibold">النتيجة الدقيقة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {meta.stages.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2.5 font-medium">{s.name}</td>
                <td className="px-3 py-2.5 text-center tabular-nums">{s.outcome}</td>
                <td className="px-3 py-2.5 text-center font-bold tabular-nums text-brand">{s.exact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <ul className="mt-3 list-disc space-y-1.5 pr-5 text-xs leading-relaxed text-muted">
        <li>النتيجة الدقيقة تمنح نقاطها كاملة ولا تُضاف إليها نقاط الفائز.</li>
        <li>تُحتسب النتيجة على الوقت الأصلي (90 دقيقة) فقط.</li>
        <li>
          في الأدوار الإقصائية: +{meta.rules.qualifierBonus} نقطة عند توقع المنتخب المتأهل بشكل صحيح، حتى لو لم تصب
          النتيجة.
        </li>
        <li>يُغلق التوقع تلقائياً عند صافرة بداية المباراة.</li>
      </ul>

      <SectionTitle>بطل البطولة</SectionTitle>
      <Card className="p-4 text-sm leading-relaxed">
        <b className="text-brand">{meta.rules.championBonus} نقطة</b> تُضاف إلى الترتيب العام إذا صح توقعك لبطل
        البطولة، ويجب تثبيت الاختيار قبل الموعد المعلن.
      </Card>

      <SectionTitle>مسابقة ترتيب المجموعات (مستقلة)</SectionTitle>
      <Card className="divide-y divide-line text-sm">
        {[
          ["المركز مطابق تماماً", gp[0]],
          ["الفرق مركز واحد", gp[1]],
          ["الفرق مركزان", gp[2]],
          ["الفرق 3 مراكز", gp[3]],
        ].map(([l, p]) => (
          <div key={l} className="flex justify-between px-4 py-2.5">
            <span>{l}</span>
            <b className="tabular-nums">{p} نقاط لكل منتخب</b>
          </div>
        ))}
      </Card>

      <SectionTitle>الجوائز والترتيب</SectionTitle>
      <ul className="list-disc space-y-1.5 pr-5 text-xs leading-relaxed text-muted">
        <li>لكل دور ترتيب مستقل يبدأ من الصفر، ويفوز أفضل 3 مشاركين في كل دور.</li>
        <li>الترتيب العام = مجموع نقاط كل الأدوار + نقاط التأهل + نقاط البطل.</li>
        <li>يمكن الفوز بجائزة دور وبالجائزة العامة معاً.</li>
        <li>
          كسر التعادل: الأكثر نتائج دقيقة، ثم الأكثر توقعات صحيحة، ثم الأكثر توقعات تأهل صحيحة، ثم تُقسم الجائزة.
        </li>
        <li>التسجيل مرة واحدة فقط برقم جوال سعودي، ويحق لإدارة تام دنتال استبعاد أي مشاركة مخالفة.</li>
      </ul>
    </div>
  );
}
