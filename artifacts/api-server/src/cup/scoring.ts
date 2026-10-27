import {
  STAGES,
  STAGE_POINTS,
  QUALIFIER_BONUS,
  CHAMPION_BONUS,
  GROUP_POSITION_POINTS,
  type Stage,
} from "./data";

export type Board = Stage | "groups" | "overall";
export const BOARDS: Board[] = [...STAGES, "groups", "overall"];

export interface MatchResult {
  id: number;
  stage: string;
  homeScore: number | null;
  awayScore: number | null;
  qualifier: string | null;
  finished: boolean;
}

export interface PredictionInput {
  participantId: number;
  matchId: number;
  homeScore: number;
  awayScore: number;
  qualifier: string | null;
}

export interface Tally {
  points: number;
  exact: number;
  outcomes: number;
  qualifiers: number;
}

export interface PredictionScore {
  points: number;
  exact: boolean;
  outcome: boolean;
  qualifier: boolean;
}

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);

export function scorePrediction(
  match: MatchResult,
  p: { homeScore: number; awayScore: number; qualifier: string | null },
): PredictionScore | null {
  if (!match.finished || match.homeScore == null || match.awayScore == null) return null;
  const pts = STAGE_POINTS[match.stage as Stage];
  const exact = p.homeScore === match.homeScore && p.awayScore === match.awayScore;
  const outcome =
    exact || sign(p.homeScore - p.awayScore) === sign(match.homeScore - match.awayScore);
  const qualifier =
    match.stage !== "group" && !!match.qualifier && p.qualifier === match.qualifier;
  const points =
    (exact ? pts.exact : outcome ? pts.outcome : 0) + (qualifier ? QUALIFIER_BONUS : 0);
  return { points, exact, outcome, qualifier };
}

export function scoreGroupOrder(predicted: string[], actual: string[]): number {
  let total = 0;
  predicted.forEach((team, i) => {
    const j = actual.indexOf(team);
    if (j === -1) return;
    total += GROUP_POSITION_POINTS[Math.abs(i - j)] ?? 0;
  });
  return total;
}

const emptyTally = (): Tally => ({ points: 0, exact: 0, outcomes: 0, qualifiers: 0 });

export interface ScoreInputs {
  participantIds: number[];
  matches: MatchResult[];
  predictions: PredictionInput[];
  groupPredictions: { participantId: number; groupLetter: string; teams: string[] }[];
  groupResults: { groupLetter: string; teams: string[] }[];
  championPredictions: { participantId: number; team: string }[];
  champion: string | null;
}

/** Returns tallies per board per participant. */
export function computeTallies(input: ScoreInputs): Map<Board, Map<number, Tally>> {
  const boards = new Map<Board, Map<number, Tally>>();
  for (const b of BOARDS) {
    const m = new Map<number, Tally>();
    for (const id of input.participantIds) m.set(id, emptyTally());
    boards.set(b, m);
  }
  const matchById = new Map(input.matches.map((m) => [m.id, m]));

  for (const p of input.predictions) {
    const match = matchById.get(p.matchId);
    if (!match) continue;
    const s = scorePrediction(match, p);
    if (!s) continue;
    for (const b of [match.stage as Board, "overall" as Board]) {
      const t = boards.get(b)?.get(p.participantId);
      if (!t) continue;
      t.points += s.points;
      if (s.exact) t.exact++;
      if (s.outcome) t.outcomes++;
      if (s.qualifier) t.qualifiers++;
    }
  }

  const results = new Map(input.groupResults.map((r) => [r.groupLetter, r.teams]));
  for (const gp of input.groupPredictions) {
    const actual = results.get(gp.groupLetter);
    if (!actual) continue;
    const t = boards.get("groups")?.get(gp.participantId);
    if (!t) continue;
    const pts = scoreGroupOrder(gp.teams, actual);
    t.points += pts;
    // tie-breaker for groups board: number of exact positions
    t.exact += gp.teams.filter((team, i) => actual[i] === team).length;
  }

  if (input.champion) {
    for (const cp of input.championPredictions) {
      if (cp.team !== input.champion) continue;
      const t = boards.get("overall")?.get(cp.participantId);
      if (t) t.points += CHAMPION_BONUS;
    }
  }

  return boards;
}

export interface RankedRow extends Tally {
  participantId: number;
  rank: number;
}

/** Sorts by points then the announced tie-breakers; equal rows share a rank. */
export function rankTallies(tallies: Map<number, Tally>): RankedRow[] {
  const rows = [...tallies.entries()].map(([participantId, t]) => ({ participantId, ...t }));
  const cmp = (a: Tally, b: Tally) =>
    b.points - a.points ||
    b.exact - a.exact ||
    b.outcomes - a.outcomes ||
    b.qualifiers - a.qualifiers;
  rows.sort((a, b) => cmp(a, b) || a.participantId - b.participantId);
  const ranked: RankedRow[] = [];
  rows.forEach((r, i) => {
    const prev = ranked[i - 1];
    const rank = prev && cmp(prev, r) === 0 ? prev.rank : i + 1;
    ranked.push({ ...r, rank });
  });
  return ranked;
}
