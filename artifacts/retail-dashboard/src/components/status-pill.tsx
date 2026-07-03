import { cn } from "@/lib/utils";

export type MarginStatus = "good" | "warning" | "serious" | "critical";

// Margin-health thresholds: net margin after marketing spend, as a fraction.
export function marginStatus(netMarginPercent: number): MarginStatus {
  if (netMarginPercent >= 0.3) return "good";
  if (netMarginPercent >= 0.15) return "warning";
  if (netMarginPercent >= 0) return "serious";
  return "critical";
}

const STATUS_LABEL: Record<MarginStatus, string> = {
  good: "Healthy",
  warning: "Watch",
  serious: "Thin",
  critical: "Negative",
};

const STATUS_DOT: Record<MarginStatus, string> = {
  good: "bg-status-good",
  warning: "bg-status-warning",
  serious: "bg-status-serious",
  critical: "bg-status-critical",
};

export function StatusPill({ status }: { status: MarginStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs font-medium">
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}
