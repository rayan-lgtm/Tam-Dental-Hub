import { db } from "@workspace/db";
import {
  retailersTable,
  saleOrdersTable,
  saleOrderLinesTable,
  marketingSpendTable,
} from "@workspace/db/schema";
import { and, eq, gte, isNull, lte, sql } from "drizzle-orm";

export interface RetailerKpi {
  retailerId: number;
  name: string;
  category: string | null;
  status: string;
  orderCount: number;
  grossRevenue: number;
  discountAmount: number;
  discountPercent: number;
  netRevenue: number;
  cogs: number;
  grossMargin: number;
  grossMarginPercent: number;
  marketingSpend: number;
  netMarginAfterMarketing: number;
  netMarginPercent: number;
  averageOrderValue: number;
  arOutstanding: number;
  lastOrderDate: string | null;
  revenuePriorPeriod: number;
  revenueGrowthPercent: number | null;
  abcClass: "A" | "B" | "C";
}

function shiftPriorPeriod(from: string, to: string): { from: string; to: string } {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const spanMs = toDate.getTime() - fromDate.getTime();
  const priorTo = new Date(fromDate.getTime() - 24 * 60 * 60 * 1000);
  const priorFrom = new Date(priorTo.getTime() - spanMs);
  return { from: priorFrom.toISOString().slice(0, 10), to: priorTo.toISOString().slice(0, 10) };
}

async function getOrderLevelAggregates(from: string, to: string) {
  return db
    .select({
      retailerId: retailersTable.id,
      name: retailersTable.name,
      category: retailersTable.category,
      status: retailersTable.status,
      orderCount: sql<number>`count(distinct ${saleOrdersTable.id})`,
      grossRevenue: sql<number>`coalesce(sum(${saleOrdersTable.subtotal}), 0)`,
      discountAmount: sql<number>`coalesce(sum(${saleOrdersTable.discountTotal}), 0)`,
      netRevenue: sql<number>`coalesce(sum(${saleOrdersTable.total} - ${saleOrdersTable.taxTotal}), 0)`,
      arOutstanding: sql<number>`coalesce(sum(${saleOrdersTable.total} - ${saleOrdersTable.amountPaid}), 0)`,
      lastOrderDate: sql<string | null>`max(${saleOrdersTable.orderDate})`,
    })
    .from(retailersTable)
    .leftJoin(
      saleOrdersTable,
      and(
        eq(saleOrdersTable.retailerId, retailersTable.id),
        gte(saleOrdersTable.orderDate, from),
        lte(saleOrdersTable.orderDate, to),
      ),
    )
    .groupBy(retailersTable.id, retailersTable.name, retailersTable.category, retailersTable.status);
}

async function getCogsByRetailer(from: string, to: string) {
  const rows = await db
    .select({
      retailerId: saleOrdersTable.retailerId,
      cogs: sql<number>`coalesce(sum(${saleOrderLinesTable.unitCostSnapshot} * ${saleOrderLinesTable.quantity}), 0)`,
    })
    .from(saleOrderLinesTable)
    .innerJoin(saleOrdersTable, eq(saleOrderLinesTable.saleOrderId, saleOrdersTable.id))
    .where(and(gte(saleOrdersTable.orderDate, from), lte(saleOrdersTable.orderDate, to)))
    .groupBy(saleOrdersTable.retailerId);

  return new Map(rows.map((r) => [r.retailerId, Number(r.cogs)]));
}

async function getDirectMarketingSpendByRetailer(from: string, to: string) {
  const rows = await db
    .select({
      retailerId: marketingSpendTable.retailerId,
      amount: sql<number>`coalesce(sum(${marketingSpendTable.amount}), 0)`,
    })
    .from(marketingSpendTable)
    .where(
      and(
        sql`${marketingSpendTable.retailerId} is not null`,
        lte(marketingSpendTable.periodStart, to),
        gte(marketingSpendTable.periodEnd, from),
      ),
    )
    .groupBy(marketingSpendTable.retailerId);

  return new Map(rows.map((r) => [r.retailerId as number, Number(r.amount)]));
}

async function getUnallocatedMarketingSpend(from: string, to: string) {
  const [row] = await db
    .select({ amount: sql<number>`coalesce(sum(${marketingSpendTable.amount}), 0)` })
    .from(marketingSpendTable)
    .where(
      and(
        isNull(marketingSpendTable.retailerId),
        lte(marketingSpendTable.periodStart, to),
        gte(marketingSpendTable.periodEnd, from),
      ),
    );
  return Number(row?.amount ?? 0);
}

// Retailer-level KPIs: revenue, margin after discounts, margin after marketing spend,
// AOV, AR/DSO exposure, growth vs. the prior period of equal length, and an ABC
// (Pareto) revenue classification. Marketing spend not attributed to a specific
// retailer is allocated across retailers proportionally to their revenue share.
export async function getRetailerKpis(from: string, to: string): Promise<RetailerKpi[]> {
  const priorPeriod = shiftPriorPeriod(from, to);
  const [current, prior, cogsByRetailer, directSpend, unallocatedSpend] = await Promise.all([
    getOrderLevelAggregates(from, to),
    getOrderLevelAggregates(priorPeriod.from, priorPeriod.to),
    getCogsByRetailer(from, to),
    getDirectMarketingSpendByRetailer(from, to),
    getUnallocatedMarketingSpend(from, to),
  ]);

  const priorRevenueByRetailer = new Map(prior.map((r) => [r.retailerId, Number(r.netRevenue)]));
  const totalNetRevenue = current.reduce((sum, r) => sum + Number(r.netRevenue), 0);

  const sortedByRevenueDesc = [...current].sort((a, b) => Number(b.netRevenue) - Number(a.netRevenue));
  const abcClassByRetailer = new Map<number, "A" | "B" | "C">();
  let cumulative = 0;
  for (const r of sortedByRevenueDesc) {
    cumulative += Number(r.netRevenue);
    const cumulativeShare = totalNetRevenue > 0 ? cumulative / totalNetRevenue : 0;
    abcClassByRetailer.set(r.retailerId, cumulativeShare <= 0.8 ? "A" : cumulativeShare <= 0.95 ? "B" : "C");
  }

  return current.map((r) => {
    const netRevenue = Number(r.netRevenue);
    const grossRevenue = Number(r.grossRevenue);
    const discountAmount = Number(r.discountAmount);
    const cogs = cogsByRetailer.get(r.retailerId) ?? 0;
    const grossMargin = netRevenue - cogs;
    const revenueShare = totalNetRevenue > 0 ? netRevenue / totalNetRevenue : 0;
    const marketingSpend = (directSpend.get(r.retailerId) ?? 0) + unallocatedSpend * revenueShare;
    const netMarginAfterMarketing = grossMargin - marketingSpend;
    const priorRevenue = priorRevenueByRetailer.get(r.retailerId) ?? 0;

    return {
      retailerId: r.retailerId,
      name: r.name,
      category: r.category,
      status: r.status,
      orderCount: Number(r.orderCount),
      grossRevenue,
      discountAmount,
      discountPercent: grossRevenue > 0 ? discountAmount / grossRevenue : 0,
      netRevenue,
      cogs,
      grossMargin,
      grossMarginPercent: netRevenue > 0 ? grossMargin / netRevenue : 0,
      marketingSpend,
      netMarginAfterMarketing,
      netMarginPercent: netRevenue > 0 ? netMarginAfterMarketing / netRevenue : 0,
      averageOrderValue: Number(r.orderCount) > 0 ? netRevenue / Number(r.orderCount) : 0,
      arOutstanding: Number(r.arOutstanding),
      lastOrderDate: r.lastOrderDate,
      revenuePriorPeriod: priorRevenue,
      revenueGrowthPercent: priorRevenue > 0 ? (netRevenue - priorRevenue) / priorRevenue : null,
      abcClass: abcClassByRetailer.get(r.retailerId) ?? "C",
    };
  });
}

export async function getDashboardSummary(from: string, to: string) {
  const kpis = await getRetailerKpis(from, to);
  const activeRetailers = kpis.filter((k) => k.orderCount > 0);

  const totals = activeRetailers.reduce(
    (acc, k) => {
      acc.netRevenue += k.netRevenue;
      acc.grossMargin += k.grossMargin;
      acc.marketingSpend += k.marketingSpend;
      acc.netMarginAfterMarketing += k.netMarginAfterMarketing;
      acc.discountAmount += k.discountAmount;
      acc.grossRevenue += k.grossRevenue;
      acc.orderCount += k.orderCount;
      acc.arOutstanding += k.arOutstanding;
      return acc;
    },
    {
      netRevenue: 0,
      grossMargin: 0,
      marketingSpend: 0,
      netMarginAfterMarketing: 0,
      discountAmount: 0,
      grossRevenue: 0,
      orderCount: 0,
      arOutstanding: 0,
    },
  );

  return {
    ...totals,
    grossMarginPercent: totals.netRevenue > 0 ? totals.grossMargin / totals.netRevenue : 0,
    netMarginPercent: totals.netRevenue > 0 ? totals.netMarginAfterMarketing / totals.netRevenue : 0,
    discountPercent: totals.grossRevenue > 0 ? totals.discountAmount / totals.grossRevenue : 0,
    activeRetailerCount: activeRetailers.length,
    averageOrderValue: totals.orderCount > 0 ? totals.netRevenue / totals.orderCount : 0,
    topRetailersByRevenue: [...activeRetailers].sort((a, b) => b.netRevenue - a.netRevenue).slice(0, 5),
    lowestMarginRetailers: [...activeRetailers].sort((a, b) => a.netMarginPercent - b.netMarginPercent).slice(0, 5),
  };
}
