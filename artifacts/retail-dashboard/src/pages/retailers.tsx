import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGetRetailerKpis, type RetailerKpi } from "@workspace/api-client-react";
import type { DateRange } from "@/lib/use-date-range";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AbcBadge } from "@/components/abc-badge";
import { StatusPill, marginStatus } from "@/components/status-pill";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const ABC_FILL: Record<"A" | "B" | "C", string> = { A: "#1c5cab", B: "#3987e5", C: "#86b6ef" };

type SortKey = keyof Pick<
  RetailerKpi,
  "name" | "netRevenue" | "discountPercent" | "grossMarginPercent" | "marketingSpend" | "netMarginPercent" | "averageOrderValue" | "orderCount" | "revenueGrowthPercent"
>;

export function RetailersPage({ range }: { range: DateRange }) {
  const { data, isLoading, isError, error } = useGetRetailerKpis(range);
  const [sortKey, setSortKey] = useState<SortKey>("netRevenue");
  const [sortDesc, setSortDesc] = useState(true);

  const sorted = useMemo(() => {
    if (!data) return [];
    const rows = [...data].filter((r) => r.orderCount > 0);
    rows.sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      if (typeof av === "string" || typeof bv === "string") {
        return sortDesc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
      }
      return sortDesc ? Number(bv) - Number(av) : Number(av) - Number(bv);
    });
    return rows;
  }, [data, sortKey, sortDesc]);

  const top10 = useMemo(
    () => [...sorted].sort((a, b) => b.netRevenue - a.netRevenue).slice(0, 10),
    [sorted],
  );

  if (isLoading) {
    return <Skeleton className="h-96 rounded-lg" />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Failed to load retailer KPIs: {(error as Error)?.message ?? "Unknown error"}
      </div>
    );
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-medium">Revenue by retailer (top 10)</h3>
          <Legend />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top10} layout="vertical" margin={{ left: 8, right: 24 }} barCategoryGap={6}>
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value, true)}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="netRevenue" radius={[0, 4, 4, 0]} barSize={16}>
                {top10.map((r) => (
                  <Cell key={r.retailerId} fill={ABC_FILL[r.abcClass]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">ABC</TableHead>
              <SortableHead label="Retailer" sortKey="name" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} />
              <SortableHead label="Revenue" sortKey="netRevenue" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
              <SortableHead label="Discount %" sortKey="discountPercent" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
              <SortableHead label="Gross Margin" sortKey="grossMarginPercent" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
              <SortableHead label="Marketing" sortKey="marketingSpend" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
              <SortableHead label="Net Margin" sortKey="netMarginPercent" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
              <SortableHead label="AOV" sortKey="averageOrderValue" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
              <SortableHead label="Orders" sortKey="orderCount" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
              <SortableHead label="Growth" sortKey="revenueGrowthPercent" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
              <TableHead>Last order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.retailerId}>
                <TableCell>
                  <AbcBadge tier={r.abcClass} />
                </TableCell>
                <TableCell className="font-medium">
                  <div>{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.category}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(r.netRevenue)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPercent(r.discountPercent)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPercent(r.grossMarginPercent)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(r.marketingSpend)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="tabular-nums">{formatPercent(r.netMarginPercent)}</span>
                    <StatusPill status={marginStatus(r.netMarginPercent)} />
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(r.averageOrderValue, true)}</TableCell>
                <TableCell className="text-right tabular-nums">{r.orderCount}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.revenueGrowthPercent === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 font-medium",
                        r.revenueGrowthPercent >= 0 ? "text-[#006300]" : "text-destructive",
                      )}
                    >
                      {r.revenueGrowthPercent >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                      {formatPercent(Math.abs(r.revenueGrowthPercent))}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(r.lastOrderDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      {(["A", "B", "C"] as const).map((tier) => (
        <span key={tier} className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: ABC_FILL[tier] }} />
          Tier {tier}
        </span>
      ))}
    </div>
  );
}

function SortableHead({
  label,
  sortKey,
  toggleSort,
  activeKey,
  desc,
  align,
}: {
  label: string;
  sortKey: SortKey;
  toggleSort: (key: SortKey) => void;
  activeKey: SortKey;
  desc: boolean;
  align?: "right";
}) {
  const isActive = activeKey === sortKey;
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        onClick={() => toggleSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {isActive && (desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
      </button>
    </TableHead>
  );
}
