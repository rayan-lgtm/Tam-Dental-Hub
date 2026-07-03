import { db } from "@workspace/db";
import { productsTable, saleOrderLinesTable, saleOrdersTable } from "@workspace/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";

export interface ProductMargin {
  productId: number;
  sku: string;
  name: string;
  category: string | null;
  unitsSold: number;
  grossRevenue: number;
  discountAmount: number;
  netRevenue: number;
  cogs: number;
  grossMargin: number;
  grossMarginPercent: number;
  avgDiscountPercent: number;
}

// Margin after discounts (and, transitively, after COGS) for every product sold in [from, to].
// COGS uses the landed-cost snapshot captured on each sale line at sync time, so historical
// margin doesn't drift if a product's current cost changes later.
export async function getProductMargins(from: string, to: string): Promise<ProductMargin[]> {
  const rows = await db
    .select({
      productId: productsTable.id,
      sku: productsTable.sku,
      name: productsTable.name,
      category: productsTable.category,
      unitsSold: sql<number>`coalesce(sum(${saleOrderLinesTable.quantity}), 0)`,
      grossRevenue: sql<number>`coalesce(sum(${saleOrderLinesTable.unitPrice} * ${saleOrderLinesTable.quantity}), 0)`,
      discountAmount: sql<number>`coalesce(sum(${saleOrderLinesTable.discountAmount}), 0)`,
      netRevenue: sql<number>`coalesce(sum(${saleOrderLinesTable.lineTotal}), 0)`,
      cogs: sql<number>`coalesce(sum(${saleOrderLinesTable.unitCostSnapshot} * ${saleOrderLinesTable.quantity}), 0)`,
    })
    .from(saleOrderLinesTable)
    .innerJoin(saleOrdersTable, eq(saleOrderLinesTable.saleOrderId, saleOrdersTable.id))
    .innerJoin(productsTable, eq(saleOrderLinesTable.productId, productsTable.id))
    .where(and(gte(saleOrdersTable.orderDate, from), lte(saleOrdersTable.orderDate, to)))
    .groupBy(productsTable.id, productsTable.sku, productsTable.name, productsTable.category);

  return rows.map((r) => {
    const grossMargin = Number(r.netRevenue) - Number(r.cogs);
    return {
      ...r,
      unitsSold: Number(r.unitsSold),
      grossRevenue: Number(r.grossRevenue),
      discountAmount: Number(r.discountAmount),
      netRevenue: Number(r.netRevenue),
      cogs: Number(r.cogs),
      grossMargin,
      grossMarginPercent: Number(r.netRevenue) > 0 ? grossMargin / Number(r.netRevenue) : 0,
      avgDiscountPercent: Number(r.grossRevenue) > 0 ? Number(r.discountAmount) / Number(r.grossRevenue) : 0,
    };
  });
}
