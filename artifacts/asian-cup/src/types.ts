export type Stage = "group" | "r16" | "qf" | "sf" | "final";
export type Board = Stage | "groups" | "overall";

export interface Team {
  code: string;
  name: string;
  flag: string;
  group: string;
}

export interface Settings {
  currentStage: Stage;
  champion: string | null;
  championDeadline: string;
  groupsDeadline: string;
}

export interface Winner {
  board: Board;
  rank: number;
  points: number;
  participantId: number;
  name: string;
  phone: string;
}

export interface Meta {
  serverTime: string;
  teams: Team[];
  groups: string[];
  stages: { id: Stage; name: string; outcome: number; exact: number }[];
  rules: { qualifierBonus: number; championBonus: number; groupPositionPoints: number[] };
  settings: Settings;
  winners: Winner[];
}

export interface Match {
  id: number;
  stage: Stage;
  round: number | null;
  groupLetter: string | null;
  kickoff: string;
  homeTeam: string | null;
  awayTeam: string | null;
  homeLabel: string;
  awayLabel: string;
  stadium: string;
  city: string;
  homeScore: number | null;
  awayScore: number | null;
  qualifier: string | null;
  finished: boolean;
}

export interface PredictionScore {
  points: number;
  exact: boolean;
  outcome: boolean;
  qualifier: boolean;
}

export interface Prediction {
  matchId: number;
  homeScore: number;
  awayScore: number;
  qualifier: string | null;
  score: PredictionScore | null;
}

export interface Me {
  participant: { id: number; name: string; phone: string };
  boards: Record<Board, { points: number; rank: number | null; total: number }>;
  predictions: Prediction[];
  groupPredictions: { group: string; teams: string[]; points: number | null }[];
  champion: string | null;
  championCorrect: boolean | null;
}

export interface LeaderRow {
  participantId: number;
  rank: number;
  points: number;
  exact: number;
  outcomes: number;
  qualifiers: number;
  name: string;
  phone: string;
}

export const BOARD_NAMES: Record<Board, string> = {
  overall: "الترتيب العام",
  group: "دور المجموعات",
  r16: "دور الـ16",
  qf: "ربع النهائي",
  sf: "نصف النهائي",
  final: "النهائي",
  groups: "ترتيب المجموعات",
};
