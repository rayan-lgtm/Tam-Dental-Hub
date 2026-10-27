import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { Team } from "../types";

export function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`size-6 animate-spin ${className}`} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(13,27,42,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  loading,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "gold"; loading?: boolean }) {
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-dark disabled:bg-brand-light",
    ghost: "bg-brand-soft/60 text-brand-dark hover:bg-brand-soft",
    gold: "bg-gold text-navy hover:brightness-95",
  }[variant];
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Flag({ team, size = "md" }: { team?: Team; size?: "sm" | "md" | "lg" }) {
  const cls = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" }[size];
  return (
    <span className={`${cls} leading-none`} aria-hidden>
      {team?.flag ?? "🏳️"}
    </span>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between">
      <h2 className="text-base font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function Chips<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: NoInfer<T>; label: string; badge?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${
            value === it.id
              ? "border-navy bg-navy text-white"
              : "border-line bg-white text-muted hover:border-brand-light"
          }`}
        >
          {it.label}
          {it.badge}
        </button>
      ))}
    </div>
  );
}

export function PointsBadge({ points }: { points: number }) {
  const tone = points > 0 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-50 text-muted ring-line";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${tone}`}>
      +{points} نقطة
    </span>
  );
}
