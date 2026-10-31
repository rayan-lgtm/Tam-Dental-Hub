import { useState } from "react";
import { fmtDay, fivePct, tone } from "../format";
import type { CriterionAvg, DailyPoint } from "../types";

const SERIES = [
  { key: "call" as const, label: "المكالمات", color: "#26717e" },
  { key: "chat" as const, label: "الشات", color: "#1691d0" },
];

/** Daily trend for calls vs chats with the target line. Plotted right-to-left to match RTL reading. */
export function TrendChart({ data, target }: { data: DailyPoint[]; target: number }) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) return null;
  const W = 640;
  const H = 200;
  const pad = { t: 12, r: 12, b: 24, l: 32 };
  const min = 30;
  const x = (i: number) =>
    data.length === 1 ? W / 2 : W - pad.r - (i * (W - pad.l - pad.r)) / (data.length - 1);
  const y = (v: number) => pad.t + ((100 - Math.max(min, v)) * (H - pad.t - pad.b)) / (100 - min);

  const path = (key: "call" | "chat") => {
    let d = "";
    data.forEach((p, i) => {
      const v = p[key];
      if (v == null) return;
      d += `${d ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    });
    return d;
  };
  const step = Math.max(1, Math.ceil(data.length / 7));
  const h = hover != null ? data[hover] : null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-muted">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0 w-4 border-t border-dashed border-good" />
          الهدف {target}
        </span>
        {h ? (
          <span className="ms-auto text-ink">
            {fmtDay(h.day)} — مكالمات <b className="tabular">{h.call ?? "—"}</b> · شات{" "}
            <b className="tabular">{h.chat ?? "—"}</b>
          </span>
        ) : null}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}>
        {[40, 60, 80, 100].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#eef3f8" />
            <text x={pad.l - 6} y={y(v) + 4} fontSize="10" fill="#8a9399" textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} stroke="#1f9d6b" strokeDasharray="4 4" />
        {SERIES.map((s) => (
          <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" />
        ))}
        {data.map((p, i) => (
          <g key={p.day}>
            {SERIES.map((s) =>
              p[s.key] != null ? (
                <circle key={s.key} cx={x(i)} cy={y(p[s.key]!)} r={hover === i ? 4.5 : 2.5} fill={s.color} />
              ) : null,
            )}
            {i % step === 0 ? (
              <text x={x(i)} y={H - 6} fontSize="10" fill="#8a9399" textAnchor="middle">
                {fmtDay(p.day)}
              </text>
            ) : null}
            <rect
              x={x(i) - (W - pad.l - pad.r) / Math.max(1, data.length - 1) / 2}
              y={0}
              width={(W - pad.l - pad.r) / Math.max(1, data.length - 1)}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Per-criterion averages (1-5) for calls and chats side by side. */
export function CriteriaBars({ criteria }: { criteria: CriterionAvg[] }) {
  return (
    <div className="space-y-3">
      {criteria.map((c) => (
        <div key={c.key}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-ink">{c.label}</span>
            <span className="tabular text-muted">
              {c.all != null ? `${c.all} / 5` : "—"}
            </span>
          </div>
          <div className="space-y-1">
            {SERIES.map((s) => {
              const v = c[s.key];
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-[10px] text-muted">{s.key === "call" ? "مكالمة" : "شات"}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-page">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${((v ?? 0) / 5) * 100}%`, background: v == null ? "transparent" : tone(fivePct(v)).hex }}
                    />
                  </div>
                  <span className="tabular w-7 shrink-0 text-end text-[11px] text-muted">{v ?? "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function OutcomeBar({ outcomes, labels }: { outcomes: { key: string; count: number }[]; labels: Record<string, string> }) {
  const total = outcomes.reduce((a, b) => a + b.count, 0);
  if (!total) return null;
  const colors: Record<string, string> = {
    booked: "#1f9d6b",
    info_given: "#87b3d4",
    follow_up: "#1691d0",
    lost: "#d64545",
    complaint: "#d98a12",
    other: "#a0aab4",
  };
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full">
        {outcomes.map((o) => (
          <div key={o.key} style={{ width: `${(o.count / total) * 100}%`, background: colors[o.key] ?? "#a0aab4" }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {outcomes.map((o) => (
          <div key={o.key} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: colors[o.key] ?? "#a0aab4" }} />
            <span className="text-muted">{labels[o.key] ?? o.key}</span>
            <span className="tabular ms-auto font-semibold">{Math.round((o.count / total) * 100)}٪</span>
          </div>
        ))}
      </div>
    </div>
  );
}
