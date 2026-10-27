const TZ = "Asia/Riyadh";
const LOCALE = "ar-SA-u-nu-latn-ca-gregory";

export const fmtDay = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(
    new Date(iso),
  );

export const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export const fmtDateTime = (iso: string) => `${fmtDay(iso)} • ${fmtTime(iso)}`;

export const dayKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));

/** "YYYY-MM-DDTHH:mm" in KSA time, for datetime-local inputs. */
export function toKsaInput(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 3 * 3600_000);
  return d.toISOString().slice(0, 16);
}

export function fromKsaInput(value: string): string {
  return new Date(`${value}:00+03:00`).toISOString();
}

export function countdown(ms: number): string {
  if (ms <= 0) return "بدأت";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d} يوم ${h} ساعة`;
  if (h > 0) return `${h} ساعة ${m} دقيقة`;
  return `${m} دقيقة`;
}
