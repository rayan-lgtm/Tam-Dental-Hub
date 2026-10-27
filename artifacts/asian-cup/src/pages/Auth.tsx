import { useState, type FormEvent } from "react";
import { Trophy, Phone, User, KeyRound, Target, Medal, RotateCcw } from "lucide-react";
import { api } from "../api";
import { Button } from "../components/ui";
import type { Meta } from "../types";
import { fmtDateTime } from "../format";

export default function Auth({ meta, onAuthed }: { meta: Meta; onAuthed: (token: string) => void }) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "register" && !agree) return setError("يرجى الموافقة على الشروط للمتابعة");
    setLoading(true);
    try {
      const res = await api<{ token: string }>(mode === "register" ? "/register" : "/login", {
        method: "POST",
        body: mode === "register" ? { name, phone, pin } : { phone, pin },
      });
      onAuthed(res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
      if (err instanceof Error && /مسجّل مسبقاً/.test(err.message)) setMode("login");
    } finally {
      setLoading(false);
    }
  };

  const group = meta.stages[0]!;
  const final = meta.stages[meta.stages.length - 1]!;

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-page">
      <section className="hero-bg relative overflow-hidden px-6 pb-20 pt-[max(env(safe-area-inset-top),28px)] text-white">
        <div className="flex items-center gap-2.5">
          <img src={`${import.meta.env.BASE_URL}icon.png`} alt="TAM Dental" className="size-10 rounded-xl ring-1 ring-white/20" />
          <span className="text-sm font-semibold tracking-wide">TAM Dental | تام دنتال</span>
        </div>
        <div className="mt-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-gold">كأس آسيا • السعودية 2027 🇸🇦</p>
            <h1 className="mt-2 text-[28px] font-bold leading-tight">
              توقّع.. اجمع النقاط..
              <br />
              واربح مع تام
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              توقّع نتائج المباريات وترتيب المجموعات. لكل دور فائزين، والعدّاد يبدأ من الصفر مع كل دور جديد.
            </p>
          </div>
          <Trophy className="mt-6 size-16 shrink-0 text-gold drop-shadow-[0_6px_20px_rgba(227,169,43,0.45)]" strokeWidth={1.4} />
        </div>
      </section>

      <div className="relative z-10 -mt-12 px-4">
        <form onSubmit={submit} className="rounded-3xl border border-line bg-white p-5 shadow-[0_12px_40px_rgba(13,27,42,0.10)]">
          <div className="mb-5 grid grid-cols-2 rounded-xl bg-page p-1 text-sm font-semibold">
            {(["register", "login"] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`rounded-lg py-2 transition ${mode === m ? "bg-white text-navy shadow-sm" : "text-muted"}`}
              >
                {m === "register" ? "مشترك جديد" : "سجّل دخولك"}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {mode === "register" && (
              <Field icon={User} label="الاسم">
                <input
                  required
                  minLength={2}
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم الكامل"
                  autoComplete="name"
                  className="w-full bg-transparent outline-none placeholder:text-slate-400"
                />
              </Field>
            )}
            <Field icon={Phone} label="رقم الجوال">
              <input
                required
                dir="ltr"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                autoComplete="tel"
                className="w-full bg-transparent text-right outline-none placeholder:text-slate-400"
              />
            </Field>
            <Field icon={KeyRound} label={mode === "register" ? "اختر رقم سري (4 أرقام)" : "الرقم السري"}>
              <input
                required
                dir="ltr"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="w-full bg-transparent text-right tracking-[0.5em] outline-none placeholder:text-slate-400"
              />
            </Field>
            {mode === "register" && (
              <label className="flex items-start gap-2 pt-1 text-xs leading-relaxed text-muted">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 size-4 accent-[#1691d0]"
                />
                أوافق على شروط المسابقة وعلى تواصل تام دنتال معي بخصوص الجوائز والعروض.
              </label>
            )}
          </div>

          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

          <Button type="submit" loading={loading} className="mt-5 w-full py-3 text-base">
            {mode === "register" ? "سجّل وابدأ التوقع" : "دخول"}
          </Button>
          {mode === "login" && (
            <p className="mt-3 text-center text-xs text-muted">نسيت الرقم السري؟ تواصل مع تام دنتال لإعادة تعيينه.</p>
          )}
        </form>

        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          <Perk icon={Target} title={`${group.outcome}–${final.exact} نقطة`} sub="لكل توقع صحيح" />
          <Perk icon={Medal} title="فائزين" sub="في كل دور" />
          <Perk icon={RotateCcw} title="تصفير" sub="مع كل دور جديد" />
        </div>
        <p className="mt-6 pb-10 text-center text-xs text-muted">
          الافتتاح: السعودية 🇸🇦 × فلسطين 🇵🇸 — {fmtDateTime("2027-01-07T20:00:00+03:00")}
        </p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      <span className="flex items-center gap-2.5 rounded-xl border border-line bg-page/60 px-3.5 py-3 text-[15px] focus-within:border-brand focus-within:bg-white">
        <Icon className="size-4 shrink-0 text-brand-light" />
        {children}
      </span>
    </label>
  );
}

function Perk({ icon: Icon, title, sub }: { icon: typeof User; title: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-2 py-3">
      <Icon className="mx-auto size-5 text-brand" />
      <p className="mt-1.5 text-[13px] font-bold text-navy">{title}</p>
      <p className="text-[11px] text-muted">{sub}</p>
    </div>
  );
}
