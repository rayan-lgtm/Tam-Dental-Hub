import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// TAM Dental call-center quality assurance (QA) agent.
// Daily samples of calls (Ittisalna) and chats (respond.io) are evaluated by
// Claude against a hospitality-grade rubric, per agent and per channel.

export type QaChannel = "call" | "chat";
export type QaSource = "manual" | "respond_io" | "ittisalna" | "demo";
export type QaStatus = "pending" | "evaluating" | "evaluated" | "failed" | "skipped";

export const qaAgentsTable = pgTable("qa_agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  branch: text("branch"),
  // Identifiers in external platforms, used to map pulled conversations to the agent
  respondIoId: text("respond_io_id"),
  ittisalnaExt: text("ittisalna_ext"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const qaInteractionsTable = pgTable(
  "qa_interactions",
  {
    id: serial("id").primaryKey(),
    agentId: integer("agent_id")
      .notNull()
      .references(() => qaAgentsTable.id, { onDelete: "cascade" }),
    channel: text("channel").$type<QaChannel>().notNull(),
    source: text("source").$type<QaSource>().notNull().default("manual"),
    externalId: text("external_id"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    durationSec: integer("duration_sec"),
    customer: text("customer"),
    transcript: text("transcript").notNull(),
    recordingUrl: text("recording_url"),
    status: text("status").$type<QaStatus>().notNull().default("pending"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("qa_interactions_source_external").on(t.source, t.externalId),
    index("qa_interactions_agent_date").on(t.agentId, t.occurredAt),
  ],
);

export interface QaCriterionResult {
  key: string;
  score: number | null; // 1-5, null = not applicable
  note: string;
}

export interface QaIssue {
  title: string;
  detail: string;
  quote: string;
  severity: "low" | "medium" | "high";
}

export const qaEvaluationsTable = pgTable("qa_evaluations", {
  id: serial("id").primaryKey(),
  interactionId: integer("interaction_id")
    .notNull()
    .unique()
    .references(() => qaInteractionsTable.id, { onDelete: "cascade" }),
  overall: integer("overall").notNull(), // 0-100, computed from weighted criteria
  criteria: jsonb("criteria").$type<QaCriterionResult[]>().notNull(),
  strengths: jsonb("strengths").$type<string[]>().notNull(),
  issues: jsonb("issues").$type<QaIssue[]>().notNull(),
  criticalFlags: jsonb("critical_flags").$type<string[]>().notNull(),
  summary: text("summary").notNull(),
  customerIntent: text("customer_intent").notNull(),
  outcome: text("outcome").notNull(), // booked | info_given | follow_up | lost | complaint | other
  sentiment: text("sentiment").notNull(), // positive | neutral | negative
  betterReply: text("better_reply"),
  coachingTip: text("coaching_tip").notNull(),
  model: text("model").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type QaAgent = typeof qaAgentsTable.$inferSelect;
export type QaInteraction = typeof qaInteractionsTable.$inferSelect;
export type QaEvaluation = typeof qaEvaluationsTable.$inferSelect;
