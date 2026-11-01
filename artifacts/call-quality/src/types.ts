export type Channel = "call" | "chat";

export interface Criterion {
  key: string;
  label: string;
  description: string;
  excellent: string;
  weights: Record<Channel, number>;
}

export interface Meta {
  criteria: Criterion[];
  criticalFlags: Record<string, string>;
  grades: { min: number; key: string; label: string }[];
  target: number;
  evaluator: boolean;
  transcription: boolean;
  ghl: boolean;
  today: string;
}

export interface Agent {
  id: number;
  name: string;
  branch: string | null;
  respondIoId: string | null;
  ittisalnaExt: string | null;
  ghlUserId: string | null;
  team: "sales" | "organic" | null;
  active: boolean;
}

export interface ChannelStats {
  count: number;
  avg: number | null;
  critical: number;
  booked: number;
}

export interface Stats extends ChannelStats {
  grade: { key: string; label: string } | null;
  call: ChannelStats;
  chat: ChannelStats;
}

export interface CriterionAvg {
  key: string;
  label: string;
  all: number | null;
  call: number | null;
  chat: number | null;
}

export interface DailyPoint {
  day: string;
  avg: number | null;
  call: number | null;
  chat: number | null;
  count: number;
}

export interface CompactEval {
  id: number;
  agentId: number;
  agentName: string;
  channel: Channel;
  occurredAt: string;
  customer: string | null;
  overall: number;
  outcome: string;
  sentiment: string;
  summary: string;
  criticalFlags: string[];
}

export interface Overview {
  target: number;
  team: Stats;
  agents: (Stats & { id: number; name: string; branch: string | null; weakest: string | null; strongest: string | null })[];
  criteria: CriterionAvg[];
  focusAreas: CriterionAvg[];
  criticalBreakdown: { key: string; label: string; count: number }[];
  outcomes: { key: string; count: number }[];
  daily: DailyPoint[];
  lowest: CompactEval[];
  best: CompactEval[];
}

export interface Issue {
  title: string;
  detail: string;
  quote: string;
  severity: "low" | "medium" | "high";
}

export interface AgentReport extends Stats {
  agent: Agent;
  target: number;
  criteria: CriterionAvg[];
  focusAreas: CriterionAvg[];
  criticalBreakdown: { key: string; label: string; count: number }[];
  outcomes: { key: string; count: number }[];
  daily: DailyPoint[];
  strengths: { text: string; id: number; count: number }[];
  issues: (Issue & { id: number; channel: Channel; count: number })[];
  coachingTips: { id: number; tip: string }[];
  evaluations: CompactEval[];
}

export interface Evaluation {
  overall: number;
  criteria: { key: string; score: number | null; note: string }[];
  strengths: string[];
  issues: Issue[];
  criticalFlags: string[];
  summary: string;
  customerIntent: string;
  outcome: string;
  sentiment: string;
  betterReply: string | null;
  coachingTip: string;
  model: string;
  createdAt: string;
}

export interface InteractionDetail {
  interaction: {
    id: number;
    agentId: number;
    channel: Channel;
    source: string;
    occurredAt: string;
    durationSec: number | null;
    customer: string | null;
    transcript: string;
    recordingUrl: string | null;
    status: string;
    error: string | null;
  };
  agent: Agent;
  evaluation: Evaluation | null;
}

export interface InteractionRow {
  id: number;
  agentId: number;
  agentName: string;
  channel: Channel;
  source: string;
  occurredAt: string;
  customer: string | null;
  status: string;
  error: string | null;
  overall: number | null;
  summary: string | null;
  outcome: string | null;
}

export type Team = "sales" | "organic";

export interface FunnelCounts {
  bookings: number;
  showed: number;
  noshow: number;
  cancelled: number;
  upcoming: number;
}

export interface FunnelRates {
  showRate: number | null;
  cancelRate: number | null;
  noshowRate: number | null;
  conversion: number | null;
  showedPerContact: number | null;
}

export interface ProductivityRow extends FunnelCounts, FunnelRates {
  id: number;
  name: string;
  team: Team | null;
  calls: number | null;
  chats: number | null;
  contacts: number | null;
  qa: number | null;
}

export interface Productivity {
  team: Team | "all";
  volumeConnected: boolean;
  totals: FunnelCounts & FunnelRates;
  staff: { bookings: number; contacts: number | null; conversion: number | null };
  online: FunnelCounts & FunnelRates;
  unassigned: FunnelCounts & { share: number | null };
  agents: ProductivityRow[];
  daily: (FunnelCounts & { day: string; contacts: number })[];
}
