import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// TAM Dental Asian Cup 2027 prediction competition.

export const cupParticipantsTable = pgTable("cup_participants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cupSessionsTable = pgTable("cup_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  participantId: integer("participant_id")
    .notNull()
    .references(() => cupParticipantsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cupMatchesTable = pgTable("cup_matches", {
  // Official match number (1-51)
  id: integer("id").primaryKey(),
  stage: text("stage").notNull(), // group | r16 | qf | sf | final
  round: integer("round"), // group-stage matchday 1-3
  groupLetter: text("group_letter"),
  kickoff: timestamp("kickoff", { withTimezone: true }).notNull(),
  homeTeam: text("home_team"), // team code, null until known
  awayTeam: text("away_team"),
  homeLabel: text("home_label").notNull(), // placeholder shown before the team is known
  awayLabel: text("away_label").notNull(),
  stadium: text("stadium").notNull(),
  city: text("city").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  qualifier: text("qualifier"), // knockout: team that advanced
  finished: boolean("finished").notNull().default(false),
});

export const cupPredictionsTable = pgTable(
  "cup_predictions",
  {
    id: serial("id").primaryKey(),
    participantId: integer("participant_id")
      .notNull()
      .references(() => cupParticipantsTable.id, { onDelete: "cascade" }),
    matchId: integer("match_id")
      .notNull()
      .references(() => cupMatchesTable.id, { onDelete: "cascade" }),
    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),
    qualifier: text("qualifier"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("cup_predictions_participant_match").on(t.participantId, t.matchId)],
);

export const cupGroupPredictionsTable = pgTable(
  "cup_group_predictions",
  {
    participantId: integer("participant_id")
      .notNull()
      .references(() => cupParticipantsTable.id, { onDelete: "cascade" }),
    groupLetter: text("group_letter").notNull(),
    teams: jsonb("teams").$type<string[]>().notNull(), // ordered 1st..4th
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.participantId, t.groupLetter] })],
);

export const cupChampionPredictionsTable = pgTable("cup_champion_predictions", {
  participantId: integer("participant_id")
    .primaryKey()
    .references(() => cupParticipantsTable.id, { onDelete: "cascade" }),
  team: text("team").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Final standings per group, entered by admin
export const cupGroupResultsTable = pgTable("cup_group_results", {
  groupLetter: text("group_letter").primaryKey(),
  teams: jsonb("teams").$type<string[]>().notNull(),
});

export const cupSettingsTable = pgTable("cup_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const cupStageWinnersTable = pgTable(
  "cup_stage_winners",
  {
    board: text("board").notNull(),
    rank: integer("rank").notNull(),
    participantId: integer("participant_id")
      .notNull()
      .references(() => cupParticipantsTable.id, { onDelete: "cascade" }),
    points: integer("points").notNull(),
    announcedAt: timestamp("announced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.board, t.rank, t.participantId] })],
);

export type CupParticipant = typeof cupParticipantsTable.$inferSelect;
export type CupMatch = typeof cupMatchesTable.$inferSelect;
export type CupPrediction = typeof cupPredictionsTable.$inferSelect;
