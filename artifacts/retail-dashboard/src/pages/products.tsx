import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGetProductMargins, type ProductMargin } from "@workspace/api-client-react";
import type { DateRange } from "@/lib/use-date-range";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill, marginStatus, type MarginStatus } from "@/components/status-pill";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_FILL: Record<MarginStatus, string> = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  serious: "var(--status-serious)",
  critical: "var(--status-critical)",
};

type SortKey = keyof Pick<
  ProductMargin,
  "name" | "unitsSold" | "netRevenue" | "avgDiscountPercent" | "cogs" | "grossMargin" | "grossMarginPercent"
>;

export function ProductsPage({ range }: { range: DateRange }) {
  const { data, isLoading, isError, error } = useGetProductMargins(range);
  const [sortKey, setSortKey] = useState<SortKey>("grossMargin");
  const [sortDesc, setSortDesc] = useState(true);

  const sorted = useMemo(() => {
    if (!data) return [];
    const rows = [...data].filter((p) => p.unitsSold > 0);
    rows.sort((a, b) => (sortDesc ? Number(b[sortKey]) - Number(a[sortKey]) : Number(a[sortKey]) - Number(b[sortKey])));
    return rows;
  }, [data, sortKey, sortDesc]);

  const lowestMargin = useMemo(
    () => [...sorted].sort((a, b) => a.grossMarginPercent - b.grossMarginPercent).slice(0, 10),
    [sorted],
  );

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />;

  if (isError || !data) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Failed to load product margins: {(error as Error)?.message ?? "Unknown error"}
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
          <h3 className="text-sm font-medium">Lowest gross margin products (after discount)</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {(["good", "warning", "serious", "critical"] as const).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_FILL[s] }} />
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lowestMargin} layout="vertical" margin={{ left: 8, right: 40 }} barCategoryGap={6}>
              <XAxis type="number" tickFormatter={(v) => formatPercent(v)} stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis type="category" dataKey="sku" width={90} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              <Tooltip
                formatter={(value: number) => formatPercent(value)}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="grossMarginPercent" radius={[0, 4, 4, 0]} barSize={14}>
                {lowestMargin.map((p) => (
                  <Cell key={p.productId} fill={STATUS_FILL[marginStatus(p.grossMarginPercent)]} />
                ))}
                <LabelList
                  dataKey="grossMarginPercent"
                  position="right"
                  formatter={(v: number) => formatPercent(v)}
                  className="fill-foreground text-[11px]"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Product" sortKey="name" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} />
              <SortableHead label="Units sold" sortKey="unitsSold" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
              <SortableHead label="Net revenue" sortKey="netRevenue" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
              <SortableHead label="Avg discount" sortKey="avgDiscountPercent" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
              <SortableHead label="COGS" sortKey="cogs" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
              <SortableHead label="Gross margin" sortKey="grossMargin" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
              <SortableHead label="Margin %" sortKey="grossMarginPercent" toggleSort={toggleSort} activeKey={sortKey} desc={sortDesc} align="right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p) => (
              <TableRow key={p.productId}>
                <TableCell className="font-medium">
                  <div>{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.sku} · {p.category}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(p.unitsSold)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(p.netRevenue)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPercent(p.avgDiscountPercent)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(p.cogs)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(p.grossMargin)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="tabular-nums">{formatPercent(p.grossMarginPercent)}</span>
                    <StatusPill status={marginStatus(p.grossMarginPercent)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
