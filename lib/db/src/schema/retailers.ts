import { pgTable, text, serial, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const retailersTable = pgTable("retailers", {
  id: serial("id").primaryKey(),
  cin7CustomerId: text("cin7_customer_id").notNull().unique(),
  name: text("name").notNull(),
  category: text("category"),
  priceTier: text("price_tier"),
  status: text("status").notNull().default("active"),
  paymentTermDays: integer("payment_term_days"),
  creditLimit: numeric("credit_limit", { precision: 14, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
});

export const insertRetailerSchema = createInsertSchema(retailersTable).omit({ id: true });
export type InsertRetailer = z.infer<typeof insertRetailerSchema>;
export type Retailer = typeof retailersTable.$inferSelect;
