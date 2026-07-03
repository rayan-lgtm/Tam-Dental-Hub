import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  sublabel,
  deltaPercent,
  deltaLabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
  deltaPercent?: number | null;
  deltaLabel?: string;
}) {
  const hasDelta = deltaPercent !== null && deltaPercent !== undefined;
  const isPositive = hasDelta && deltaPercent >= 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs">
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              isPositive ? "text-[#006300]" : "text-destructive",
            )}
          >
            {isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
            {Math.abs(deltaPercent * 100).toFixed(1)}%
          </span>
        )}
        <span className="text-muted-foreground">{deltaLabel ?? sublabel}</span>
      </div>
    </div>
  );
}
