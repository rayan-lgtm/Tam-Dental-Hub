import { pgTable, text, serial, numeric, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { retailersTable } from "./retailers";

export const marketingSpendTable = pgTable("marketing_spend", {
  id: serial("id").primaryKey(),
  // Null retailerId = unallocated/overall brand spend (not attributable to one retailer).
  retailerId: integer("retailer_id").references(() => retailersTable.id),
  channel: text("channel").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  source: text("source").notNull().default("manual"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMarketingSpendSchema = createInsertSchema(marketingSpendTable).omit({ id: true });
export type InsertMarketingSpend = z.infer<typeof insertMarketingSpendSchema>;
export type MarketingSpend = typeof marketingSpendTable.$inferSelect;
