import { AlertTriangle, Phone, MessageCircle } from "lucide-react";
import type { Meta } from "../types";
import { Card, CardTitle } from "../components/ui";

export default function Rubric({ meta }: { meta: Meta }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">معايير التقييم</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
          مبنية على معايير مراكز الاتصال العالمية (COPC وISO 18295 وأبحاث الحل من أول تواصل) ومعايير الضيافة الفاخرة
          (Forbes Travel Guide وRitz-Carlton) وممارسات تجربة المريض في القطاع الصحي، ومُكيّفة لعيادات تام دنتال وفئتها
          المستهدفة. كل معيار يُقيّم من 1 إلى 5، ثم يُحسب التقييم الشامل من 100 بالأوزان التالية.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {meta.grades.map((g) => (
          <Card key={g.key} className="py-3 text-center">
            <div className="tabular text-lg font-bold">{g.min}+</div>
            <div className="text-xs text-muted">{g.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-page text-xs text-muted">
              <tr>
                <th className="px-4 py-2 text-start font-semibold">المعيار</th>
                <th className="px-2 py-2 text-start font-semibold">ماذا نقيس</th>
                <th className="px-2 py-2 text-start font-semibold">شكل الأداء الممتاز (5)</th>
                <th className="px-2 py-2 text-center font-semibold">
                  <Phone className="inline size-3.5" /> وزن
                </th>
                <th className="px-2 py-2 text-center font-semibold">
                  <MessageCircle className="inline size-3.5" /> وزن
                </th>
              </tr>
            </thead>
            <tbody>
              {meta.criteria.map((c) => (
                <tr key={c.key} className="border-t border-line align-top">
                  <td className="px-4 py-3 font-semibold">{c.label}</td>
                  <td className="px-2 py-3 text-muted">{c.description}</td>
                  <td className="px-2 py-3 leading-relaxed">{c.excellent}</td>
                  <td className="tabular px-2 py-3 text-center">{c.weights.call}٪</td>
                  <td className="tabular px-2 py-3 text-center">{c.weights.chat}٪</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle>
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="size-4 text-bad" /> الأخطاء الحرجة
          </span>
        </CardTitle>
        <p className="mb-2 text-sm text-muted">
          وجود أي منها يحدّ التقييم الشامل للمحادثة عند 40 كحد أقصى (ممارسة «الإخفاق التلقائي» في مراكز الاتصال)، ويظهر تنبيه في اللوحة.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {Object.entries(meta.criticalFlags).map(([k, v]) => (
            <li key={k} className="rounded-lg bg-bad/5 px-3 py-2 text-sm text-bad">
              {v}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
