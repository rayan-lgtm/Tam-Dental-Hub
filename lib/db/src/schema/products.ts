import { pgTable, text, serial, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  cin7ProductId: text("cin7_product_id").notNull().unique(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category"),
  brand: text("brand"),
  // Cin7 "AverageCost" / landed cost per unit at time of last sync.
  landedCost: numeric("landed_cost", { precision: 14, scale: 4 }),
  // List/retail price (pre-discount) as configured in Cin7.
  listPrice: numeric("list_price", { precision: 14, scale: 4 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
