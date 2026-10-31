import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2, Phone, MessageCircle } from "lucide-react";
import { tone, gradeLabel } from "../format";
import type { Channel } from "../types";

export function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`size-6 animate-spin text-brand ${className}`} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(13,27,42,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-sm font-bold text-ink">{children}</h3>
      {action}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  loading,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger"; loading?: boolean }) {
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-dark disabled:bg-brand-light",
    ghost: "bg-brand-soft/60 text-brand-dark hover:bg-brand-soft",
    danger: "bg-bad/10 text-bad hover:bg-bad/20",
  }[variant];
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-line">
      {items.map((i) => (
        <button
          key={i.key}
          onClick={() => onChange(i.key)}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            value === i.key ? "bg-navy text-white" : "text-muted hover:bg-page"
          }`}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

/** Big circular score (0-100). */
export function ScoreRing({ score, size = 112, label }: { score: number | null; size?: number; label?: string }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const t = tone(score);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e0edf7" strokeWidth={10} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={t.hex}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * (score ?? 0)) / 100}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`tabular text-3xl font-bold ${t.text}`}>{score ?? "—"}</span>
          <span className="text-[10px] text-muted">من 100</span>
        </div>
      </div>
      <span className={`text-xs font-semibold ${t.text}`}>{label ?? gradeLabel(score)}</span>
    </div>
  );
}

export function ScorePill({ score }: { score: number | null }) {
  const t = tone(score);
  return (
    <span className={`tabular inline-flex min-w-11 justify-center rounded-lg px-2 py-0.5 text-sm font-bold ${t.soft} ${t.text}`}>
      {score ?? "—"}
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: Channel }) {
  const Icon = channel === "call" ? Phone : MessageCircle;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
        channel === "call" ? "bg-teal/10 text-teal" : "bg-brand/10 text-brand-dark"
      }`}
    >
      <Icon className="size-3" />
      {channel === "call" ? "مكالمة" : "شات"}
    </span>
  );
}

export function Stat({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <Card className="flex items-start justify-between gap-2">
      <div>
        <div className="text-xs text-muted">{label}</div>
        <div className="tabular mt-1 text-2xl font-bold text-ink">{value}</div>
        {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
      </div>
      {icon ? <div className="rounded-xl bg-page p-2 text-brand">{icon}</div> : null}
    </Card>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl bg-page px-4 py-8 text-center text-sm text-muted">{children}</div>;
}

export function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">{message}</div>;
}

export const inputCls =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
