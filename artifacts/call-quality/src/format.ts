import type { Channel } from "./types";

export const CHANNEL_LABEL: Record<Channel, string> = { call: "المكالمات", chat: "الشات" };
export const CHANNEL_SINGLE: Record<Channel, string> = { call: "مكالمة", chat: "شات" };

export const OUTCOME_LABEL: Record<string, string> = {
  booked: "تم الحجز",
  info_given: "معلومات فقط",
  follow_up: "متابعة لاحقة",
  lost: "فرصة ضائعة",
  complaint: "شكوى",
  other: "أخرى",
};

export const SENTIMENT_LABEL: Record<string, string> = {
  positive: "راضٍ",
  neutral: "محايد",
  negative: "غير راضٍ",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار التقييم",
  evaluating: "جارٍ التقييم",
  evaluated: "تم التقييم",
  failed: "فشل التقييم",
  skipped: "خارج العينة",
};

export const SEVERITY_LABEL = { high: "عالية", medium: "متوسطة", low: "منخفضة" } as const;

export function gradeLabel(score: number | null): string {
  if (score == null) return "—";
  if (score >= 90) return "ممتاز — مستوى عالمي";
  if (score >= 80) return "جيد جداً";
  if (score >= 70) return "جيد";
  if (score >= 60) return "يحتاج تحسين";
  return "ضعيف";
}

/** Tailwind text/bg classes by score band. */
export function tone(score: number | null) {
  if (score == null) return { text: "text-muted", bg: "bg-line", soft: "bg-page", hex: "#a0aab4" };
  if (score >= 85) return { text: "text-good", bg: "bg-good", soft: "bg-good/10", hex: "#1f9d6b" };
  if (score >= 70) return { text: "text-brand-dark", bg: "bg-brand", soft: "bg-brand/10", hex: "#1691d0" };
  if (score >= 60) return { text: "text-warn", bg: "bg-warn", soft: "bg-warn/10", hex: "#d98a12" };
  return { text: "text-bad", bg: "bg-bad", soft: "bg-bad/10", hex: "#d64545" };
}

/** 1-5 criterion average → 0-100 for coloring. */
export const fivePct = (x: number | null) => (x == null ? null : Math.round((x / 5) * 100));

const dateFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  timeZone: "Asia/Riyadh",
  day: "numeric",
  month: "short",
});
const dateTimeFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  timeZone: "Asia/Riyadh",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export const fmtDay = (key: string) => dateFmt.format(new Date(`${key}T12:00:00Z`));
export const fmtDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

export const addDays = (key: string, n: number) => {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const todayKey = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);

export type RangeKey = "today" | "yesterday" | "7d" | "month" | "last_month";

export const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "اليوم" },
  { key: "yesterday", label: "أمس" },
  { key: "7d", label: "آخر ٧ أيام" },
  { key: "month", label: "هذا الشهر" },
  { key: "last_month", label: "الشهر الماضي" },
];

export function rangeDates(key: RangeKey): { from: string; to: string } {
  const t = todayKey();
  switch (key) {
    case "today":
      return { from: t, to: t };
    case "yesterday":
      return { from: addDays(t, -1), to: addDays(t, -1) };
    case "7d":
      return { from: addDays(t, -6), to: t };
    case "month":
      return { from: `${t.slice(0, 8)}01`, to: t };
    case "last_month": {
      const firstThis = `${t.slice(0, 8)}01`;
      const lastPrev = addDays(firstThis, -1);
      return { from: `${lastPrev.slice(0, 8)}01`, to: lastPrev };
    }
  }
}
