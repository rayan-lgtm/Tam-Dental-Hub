import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cin7SyncStateTable = pgTable("cin7_sync_state", {
  resource: text("resource").primaryKey(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastCursor: text("last_cursor"),
  recordsSynced: integer("records_synced").notNull().default(0),
  status: text("status").notNull().default("idle"),
  lastError: text("last_error"),
});

export const insertCin7SyncStateSchema = createInsertSchema(cin7SyncStateTable);
export type InsertCin7SyncState = z.infer<typeof insertCin7SyncStateSchema>;
export type Cin7SyncState = typeof cin7SyncStateTable.$inferSelect;
