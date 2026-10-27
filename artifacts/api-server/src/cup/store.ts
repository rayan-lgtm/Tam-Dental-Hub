import { sql, inArray } from "drizzle-orm";
import {
  db,
  cupMatchesTable,
  cupParticipantsTable,
  cupPredictionsTable,
  cupGroupPredictionsTable,
  cupChampionPredictionsTable,
  cupGroupResultsTable,
  cupSettingsTable,
  cupStageWinnersTable,
} from "@workspace/db";
import { FIXTURES, TEAMS, TOURNAMENT_START, venueOf, type Stage } from "./data";
import { computeTallies, rankTallies, BOARDS, type Board, type RankedRow } from "./scoring";

export interface Settings {
  currentStage: Stage;
  champion: string | null;
  championDeadline: string;
  groupsDeadline: string;
}

const DEFAULT_SETTINGS: Settings = {
  currentStage: "group",
  champion: null,
  championDeadline: TOURNAMENT_START,
  groupsDeadline: TOURNAMENT_START,
};

let seeded: Promise<void> | null = null;

/** Inserts fixtures once; existing rows (and admin edits) are left untouched. */
export function ensureSeed(): Promise<void> {
  seeded ??= (async () => {
    const isTeam = new Set(TEAMS.map((t) => t.code));
    await db
      .insert(cupMatchesTable)
      .values(
        FIXTURES.map((f) => {
          const known = (x: string) => (isTeam.has(x) ? x : null);
          const label = (x: string) => TEAMS.find((t) => t.code === x)?.name ?? x;
          return {
            id: f.id,
            stage: f.stage,
            round: f.round,
            groupLetter: f.group,
            kickoff: new Date(f.kickoff),
            homeTeam: known(f.home),
            awayTeam: known(f.away),
            homeLabel: label(f.home),
            awayLabel: label(f.away),
            ...venueOf(f.venue),
          };
        }),
      )
      .onConflictDoNothing();
  })().catch((err) => {
    seeded = null;
    throw err;
  });
  return seeded;
}

export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(cupSettingsTable);
  const s = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const r of rows) s[r.key] = r.value;
  return s as unknown as Settings;
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    await db
      .insert(cupSettingsTable)
      .values({ key, value: value as unknown })
      .onConflictDoUpdate({ target: cupSettingsTable.key, set: { value: value as unknown } });
  }
  invalidateStandings();
}

export interface Standings {
  ranked: Map<Board, RankedRow[]>;
  active: Map<Board, Set<number>>;
  names: Map<number, { name: string; phone: string }>;
}

let cache: { at: number; value: Promise<Standings> } | null = null;
const CACHE_MS = 20_000;

export function invalidateStandings() {
  cache = null;
}

export function getStandings(): Promise<Standings> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const value = loadStandings();
  cache = { at: Date.now(), value };
  value.catch(() => (cache = null));
  return value;
}

async function loadStandings(): Promise<Standings> {
  const [participants, matches, predictions, groupPredictions, groupResults, championPredictions, settings] =
    await Promise.all([
      db
        .select({
          id: cupParticipantsTable.id,
          name: cupParticipantsTable.name,
          phone: cupParticipantsTable.phone,
        })
        .from(cupParticipantsTable),
      db.select().from(cupMatchesTable),
      db
        .select({
          participantId: cupPredictionsTable.participantId,
          matchId: cupPredictionsTable.matchId,
          homeScore: cupPredictionsTable.homeScore,
          awayScore: cupPredictionsTable.awayScore,
          qualifier: cupPredictionsTable.qualifier,
        })
        .from(cupPredictionsTable),
      db.select().from(cupGroupPredictionsTable),
      db.select().from(cupGroupResultsTable),
      db.select().from(cupChampionPredictionsTable),
      getSettings(),
    ]);

  const tallies = computeTallies({
    participantIds: participants.map((p) => p.id),
    matches,
    predictions,
    groupPredictions,
    groupResults,
    championPredictions,
    champion: settings.champion,
  });

  // Only participants who took part in a board appear on it
  const active = new Map<Board, Set<number>>(BOARDS.map((b) => [b, new Set<number>()]));
  const stageOf = new Map(matches.map((m) => [m.id, m.stage as Board]));
  for (const p of predictions) {
    active.get(stageOf.get(p.matchId)!)?.add(p.participantId);
    active.get("overall")!.add(p.participantId);
  }
  for (const gp of groupPredictions) active.get("groups")!.add(gp.participantId);
  for (const cp of championPredictions) active.get("overall")!.add(cp.participantId);

  const ranked = new Map<Board, RankedRow[]>();
  for (const b of BOARDS) {
    const t = tallies.get(b)!;
    const set = active.get(b)!;
    for (const id of [...t.keys()]) if (!set.has(id)) t.delete(id);
    ranked.set(b, rankTallies(t));
  }

  return {
    ranked,
    active,
    names: new Map(participants.map((p) => [p.id, { name: p.name, phone: p.phone }])),
  };
}

export async function announceWinners(board: Board, top = 3): Promise<number> {
  invalidateStandings();
  const standings = await getStandings();
  const rows = (standings.ranked.get(board) ?? []).filter((r) => r.rank <= top && r.points > 0);
  await db.transaction(async (tx) => {
    await tx.delete(cupStageWinnersTable).where(sql`${cupStageWinnersTable.board} = ${board}`);
    if (rows.length)
      await tx.insert(cupStageWinnersTable).values(
        rows.map((r) => ({ board, rank: r.rank, participantId: r.participantId, points: r.points })),
      );
  });
  return rows.length;
}

export async function getWinners() {
  const rows = await db.select().from(cupStageWinnersTable);
  if (!rows.length) return [];
  const people = await db
    .select({ id: cupParticipantsTable.id, name: cupParticipantsTable.name, phone: cupParticipantsTable.phone })
    .from(cupParticipantsTable)
    .where(inArray(cupParticipantsTable.id, [...new Set(rows.map((r) => r.participantId))]));
  const byId = new Map(people.map((p) => [p.id, p]));
  return rows
    .sort((a, b) => a.rank - b.rank)
    .map((r) => ({
      board: r.board,
      rank: r.rank,
      points: r.points,
      participantId: r.participantId,
      name: byId.get(r.participantId)?.name ?? "",
      phone: byId.get(r.participantId)?.phone ?? "",
      announcedAt: r.announcedAt,
    }));
}

export function maskPhone(phone: string): string {
  return phone.length >= 6 ? `${phone.slice(0, 3)}•••••${phone.slice(-2)}` : phone;
}
