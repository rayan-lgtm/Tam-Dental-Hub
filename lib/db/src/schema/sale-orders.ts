import { pgTable, text, serial, numeric, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { retailersTable } from "./retailers";
import { productsTable } from "./products";

export const saleOrdersTable = pgTable("sale_orders", {
  id: serial("id").primaryKey(),
  cin7SaleId: text("cin7_sale_id").notNull().unique(),
  retailerId: integer("retailer_id")
    .notNull()
    .references(() => retailersTable.id),
  orderDate: date("order_date").notNull(),
  invoiceDate: date("invoice_date"),
  status: text("status").notNull(),
  currency: text("currency").notNull().default("SAR"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  discountTotal: numeric("discount_total", { precision: 14, scale: 2 }).notNull().default("0"),
  taxTotal: numeric("tax_total", { precision: 14, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 14, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
});

export const insertSaleOrderSchema = createInsertSchema(saleOrdersTable).omit({ id: true });
export type InsertSaleOrder = z.infer<typeof insertSaleOrderSchema>;
export type SaleOrder = typeof saleOrdersTable.$inferSelect;

export const saleOrderLinesTable = pgTable("sale_order_lines", {
  id: serial("id").primaryKey(),
  saleOrderId: integer("sale_order_id")
    .notNull()
    .references(() => saleOrdersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => productsTable.id),
  // Snapshots at time of sale so historical margin doesn't drift when product cost/price changes later.
  skuSnapshot: text("sku_snapshot").notNull(),
  quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 4 }).notNull(),
  discountPercent: numeric("discount_percent", { precision: 6, scale: 3 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull(),
  unitCostSnapshot: numeric("unit_cost_snapshot", { precision: 14, scale: 4 }),
});

export const insertSaleOrderLineSchema = createInsertSchema(saleOrderLinesTable).omit({ id: true });
export type InsertSaleOrderLine = z.infer<typeof insertSaleOrderLineSchema>;
export type SaleOrderLine = typeof saleOrderLinesTable.$inferSelect;
