import { useGetDashboardSummary } from "@workspace/api-client-react";
import type { DateRange } from "@/lib/use-date-range";
import { StatTile } from "@/components/stat-tile";
import { StatusPill, marginStatus } from "@/components/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/format";

export function OverviewPage({
  range,
  onViewRetailers,
}: {
  range: DateRange;
  onViewRetailers: () => void;
}) {
  const { data, isLoading, isError, error } = useGetDashboardSummary(range);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Failed to load dashboard summary: {(error as Error)?.message ?? "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Net Revenue" value={formatCurrency(data.netRevenue)} sublabel="after discounts" />
        <StatTile
          label="Gross Margin"
          value={formatPercent(data.grossMarginPercent)}
          sublabel={formatCurrency(data.grossMargin)}
        />
        <StatTile
          label="Net Margin (after marketing)"
          value={formatPercent(data.netMarginPercent)}
          sublabel={formatCurrency(data.netMarginAfterMarketing)}
        />
        <StatTile label="Marketing Spend" value={formatCurrency(data.marketingSpend)} sublabel="incl. media buying" />
        <StatTile label="Avg Discount" value={formatPercent(data.discountPercent)} sublabel={formatCurrency(data.discountAmount)} />
        <StatTile label="Average Order Value" value={formatCurrency(data.averageOrderValue, true)} sublabel={`${data.orderCount} orders`} />
        <StatTile label="Active Retailers" value={String(data.activeRetailerCount)} sublabel="with orders in range" />
        <StatTile label="AR Outstanding" value={formatCurrency(data.arOutstanding)} sublabel="unpaid invoice balance" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RetailerMiniTable
          title="Top retailers by revenue"
          rows={data.topRetailersByRevenue}
          onViewAll={onViewRetailers}
        />
        <RetailerMiniTable
          title="Lowest net margin retailers"
          rows={data.lowestMarginRetailers}
          onViewAll={onViewRetailers}
          flagLowMargin
        />
      </div>
    </div>
  );
}

function RetailerMiniTable({
  title,
  rows,
  onViewAll,
  flagLowMargin,
}: {
  title: string;
  rows: { retailerId: number; name: string; netRevenue: number; netMarginPercent: number }[];
  onViewAll: () => void;
  flagLowMargin?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View all
        </Button>
      </div>
      <div className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No data in this range.</p>}
        {rows.map((r) => (
          <div key={r.retailerId} className="flex items-center justify-between text-sm">
            <span className="truncate">{r.name}</span>
            <div className="flex items-center gap-2 tabular-nums">
              <span className="text-muted-foreground">{formatCurrency(r.netRevenue)}</span>
              {flagLowMargin ? (
                <StatusPill status={marginStatus(r.netMarginPercent)} />
              ) : (
                <span className="w-14 text-right">{formatPercent(r.netMarginPercent)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
