import { and, eq, gte, lt, inArray, desc } from "drizzle-orm";
import {
  db,
  qaAgentsTable,
  qaInteractionsTable,
  qaEvaluationsTable,
  type QaAgent,
  type QaChannel,
  type QaEvaluation,
  type QaInteraction,
} from "@workspace/db";
import { evaluateInteraction } from "./evaluator";
import { transcribeRecording } from "./transcribe";
import { CRITERIA, CRITICAL_FLAGS, TARGET_SCORE, gradeOf } from "./rubric";

// ---------- Dates (Saudi Arabia is UTC+3 all year) ----------

const KSA_OFFSET_MS = 3 * 3600_000;

/** YYYY-MM-DD in Riyadh time. */
export const dayKey = (d: Date) => new Date(d.getTime() + KSA_OFFSET_MS).toISOString().slice(0, 10);

/** Start of a Riyadh calendar day (YYYY-MM-DD) as a UTC Date. */
export const dayStart = (key: string) => new Date(new Date(`${key}T00:00:00Z`).getTime() - KSA_OFFSET_MS);

export const addDays = (key: string, n: number) => {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const todayKey = () => dayKey(new Date());

// ---------- Evaluation ----------

const SAMPLES_PER_DAY = Math.min(5, Math.max(3, Number(process.env["QA_SAMPLES_PER_DAY"] ?? 4)));
/** Ignore conversations too short to judge (missed calls, "ok thanks" chats). */
const MIN_TRANSCRIPT_CHARS = 120;

export async function evaluateById(interactionId: number): Promise<QaEvaluation> {
  const [row] = await db
    .select({ i: qaInteractionsTable, a: qaAgentsTable })
    .from(qaInteractionsTable)
    .innerJoin(qaAgentsTable, eq(qaAgentsTable.id, qaInteractionsTable.agentId))
    .where(eq(qaInteractionsTable.id, interactionId));
  if (!row) throw new Error("المحادثة غير موجودة");
  const { i, a } = row;

  await db
    .update(qaInteractionsTable)
    .set({ status: "evaluating", error: null })
    .where(eq(qaInteractionsTable.id, i.id));

  try {
    let transcript = i.transcript;
    if (!transcript.trim() && i.recordingUrl) {
      transcript = await transcribeRecording(i.recordingUrl);
      await db.update(qaInteractionsTable).set({ transcript }).where(eq(qaInteractionsTable.id, i.id));
    }
    if (!transcript.trim()) throw new Error("لا يوجد نص للمحادثة");

    const result = await evaluateInteraction({
      channel: i.channel,
      agentName: a.name,
      occurredAt: i.occurredAt,
      durationSec: i.durationSec,
      transcript,
    });

    const values = { interactionId: i.id, ...result };
    const [saved] = await db
      .insert(qaEvaluationsTable)
      .values(values)
      .onConflictDoUpdate({ target: qaEvaluationsTable.interactionId, set: { ...result, createdAt: new Date() } })
      .returning();
    await db.update(qaInteractionsTable).set({ status: "evaluated" }).where(eq(qaInteractionsTable.id, i.id));
    return saved!;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(qaInteractionsTable)
      .set({ status: "failed", error: message.slice(0, 500) })
      .where(eq(qaInteractionsTable.id, i.id));
    throw err;
  }
}

async function runPool<T>(items: T[], limit: number, fn: (x: T) => Promise<unknown>) {
  let next = 0;
  let ok = 0;
  let failed = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next++]!;
        try {
          await fn(item);
          ok++;
        } catch (err) {
          failed++;
          console.error("[qa] evaluation failed", err);
        }
      }
    }),
  );
  return { ok, failed };
}

/**
 * Picks a varied sample: the longest conversation (most to learn from), the shortest
 * judgeable one, then random picks — so the sample is not biased toward easy chats.
 */
function pickSample(rows: QaInteraction[], n: number): QaInteraction[] {
  const usable = rows.filter((r) => r.transcript.length >= MIN_TRANSCRIPT_CHARS || r.recordingUrl);
  if (usable.length <= n) return usable;
  const size = (r: QaInteraction) => r.durationSec ?? r.transcript.length;
  const sorted = [...usable].sort((a, b) => size(b) - size(a));
  const picked = [sorted[0]!, sorted[sorted.length - 1]!];
  const rest = sorted.slice(1, -1);
  while (picked.length < n && rest.length) {
    picked.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]!);
  }
  return picked;
}

/**
 * Daily job: for every active agent and channel, sample 3-5 pending conversations
 * from the given Riyadh day, evaluate them, and mark the rest as skipped.
 */
export async function runDaily(day: string) {
  const from = dayStart(day);
  const to = dayStart(addDays(day, 1));
  const pending = await db
    .select()
    .from(qaInteractionsTable)
    .where(
      and(
        eq(qaInteractionsTable.status, "pending"),
        gte(qaInteractionsTable.occurredAt, from),
        lt(qaInteractionsTable.occurredAt, to),
      ),
    );

  // Already-evaluated conversations count toward the day's quota (e.g. manual reviews).
  const done = await db
    .select({ agentId: qaInteractionsTable.agentId, channel: qaInteractionsTable.channel })
    .from(qaInteractionsTable)
    .where(
      and(
        eq(qaInteractionsTable.status, "evaluated"),
        gte(qaInteractionsTable.occurredAt, from),
        lt(qaInteractionsTable.occurredAt, to),
      ),
    );

  const groups = new Map<string, QaInteraction[]>();
  for (const r of pending) {
    const k = `${r.agentId}:${r.channel}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }

  const toEvaluate: QaInteraction[] = [];
  const toSkip: number[] = [];
  for (const [k, rows] of groups) {
    const already = done.filter((d) => `${d.agentId}:${d.channel}` === k).length;
    const sample = pickSample(rows, Math.max(0, SAMPLES_PER_DAY - already));
    const ids = new Set(sample.map((s) => s.id));
    toEvaluate.push(...sample);
    toSkip.push(...rows.filter((r) => !ids.has(r.id)).map((r) => r.id));
  }

  if (toSkip.length) {
    await db.update(qaInteractionsTable).set({ status: "skipped" }).where(inArray(qaInteractionsTable.id, toSkip));
  }
  const { ok, failed } = await runPool(toEvaluate, 3, (i) => evaluateById(i.id));
  return { day, sampled: toEvaluate.length, evaluated: ok, failed, skipped: toSkip.length };
}

// ---------- Reporting ----------

export interface EvalRow {
  evaluation: QaEvaluation;
  interaction: QaInteraction;
  agent: QaAgent;
}

export async function loadEvaluations(from: Date, to: Date, agentId?: number): Promise<EvalRow[]> {
  const conds = [gte(qaInteractionsTable.occurredAt, from), lt(qaInteractionsTable.occurredAt, to)];
  if (agentId) conds.push(eq(qaInteractionsTable.agentId, agentId));
  return db
    .select({ evaluation: qaEvaluationsTable, interaction: qaInteractionsTable, agent: qaAgentsTable })
    .from(qaEvaluationsTable)
    .innerJoin(qaInteractionsTable, eq(qaInteractionsTable.id, qaEvaluationsTable.interactionId))
    .innerJoin(qaAgentsTable, eq(qaAgentsTable.id, qaInteractionsTable.agentId))
    .where(and(...conds))
    .orderBy(desc(qaInteractionsTable.occurredAt));
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const avg1 = (xs: number[]) =>
  xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null;

function channelStats(rows: EvalRow[]) {
  const scores = rows.map((r) => r.evaluation.overall);
  return {
    count: rows.length,
    avg: avg(scores),
    critical: rows.filter((r) => r.evaluation.criticalFlags.length).length,
    booked: rows.filter((r) => r.evaluation.outcome === "booked").length,
  };
}

function stats(rows: EvalRow[]) {
  const call = rows.filter((r) => r.interaction.channel === "call");
  const chat = rows.filter((r) => r.interaction.channel === "chat");
  const all = channelStats(rows);
  return { ...all, grade: all.avg != null ? gradeOf(all.avg) : null, call: channelStats(call), chat: channelStats(chat) };
}

function criteriaAverages(rows: EvalRow[]) {
  return CRITERIA.map((c) => {
    const by = (ch?: QaChannel) =>
      avg1(
        rows
          .filter((r) => !ch || r.interaction.channel === ch)
          .map((r) => r.evaluation.criteria.find((x) => x.key === c.key)?.score)
          .filter((s): s is number => s != null),
      );
    return { key: c.key, label: c.label, all: by(), call: by("call"), chat: by("chat") };
  });
}

function dailySeries(rows: EvalRow[]) {
  const map = new Map<string, EvalRow[]>();
  for (const r of rows) {
    const k = dayKey(r.interaction.occurredAt);
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, rs]) => ({
      day,
      avg: avg(rs.map((r) => r.evaluation.overall)),
      call: avg(rs.filter((r) => r.interaction.channel === "call").map((r) => r.evaluation.overall)),
      chat: avg(rs.filter((r) => r.interaction.channel === "chat").map((r) => r.evaluation.overall)),
      count: rs.length,
    }));
}

function countBy(values: string[]) {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

function criticalSummary(rows: EvalRow[]) {
  return countBy(rows.flatMap((r) => r.evaluation.criticalFlags)).map((x) => ({
    ...x,
    label: CRITICAL_FLAGS[x.key] ?? x.key,
  }));
}

/** The weakest criteria are the team's recurring issues. */
function weakest(criteria: ReturnType<typeof criteriaAverages>, n = 3) {
  return criteria
    .filter((c) => c.all != null)
    .sort((a, b) => a.all! - b.all!)
    .slice(0, n);
}

function compactEval(r: EvalRow) {
  return {
    id: r.interaction.id,
    agentId: r.agent.id,
    agentName: r.agent.name,
    channel: r.interaction.channel,
    occurredAt: r.interaction.occurredAt,
    customer: r.interaction.customer,
    overall: r.evaluation.overall,
    outcome: r.evaluation.outcome,
    sentiment: r.evaluation.sentiment,
    summary: r.evaluation.summary,
    criticalFlags: r.evaluation.criticalFlags,
  };
}

export async function overview(from: Date, to: Date) {
  const rows = await loadEvaluations(from, to);
  const agents = await db.select().from(qaAgentsTable).where(eq(qaAgentsTable.active, true));
  const criteria = criteriaAverages(rows);

  const agentRows = agents
    .map((a) => {
      const rs = rows.filter((r) => r.agent.id === a.id);
      const crit = criteriaAverages(rs);
      return {
        id: a.id,
        name: a.name,
        branch: a.branch,
        ...stats(rs),
        weakest: weakest(crit, 1)[0]?.label ?? null,
        strongest:
          crit
            .filter((c) => c.all != null)
            .sort((x, y) => y.all! - x.all!)[0]?.label ?? null,
      };
    })
    .sort((x, y) => (y.avg ?? -1) - (x.avg ?? -1));

  return {
    target: TARGET_SCORE,
    team: stats(rows),
    agents: agentRows,
    criteria,
    focusAreas: weakest(criteria),
    criticalBreakdown: criticalSummary(rows),
    outcomes: countBy(rows.map((r) => r.evaluation.outcome)),
    daily: dailySeries(rows),
    lowest: [...rows]
      .sort((a, b) => a.evaluation.overall - b.evaluation.overall)
      .slice(0, 5)
      .map(compactEval),
    best: [...rows]
      .sort((a, b) => b.evaluation.overall - a.evaluation.overall)
      .slice(0, 3)
      .map(compactEval),
  };
}

/** Collapses repeated findings (same text) into one entry with a count; keeps the most recent example. */
function groupBy<T>(items: T[], key: (x: T) => string): (T & { count: number })[] {
  const m = new Map<string, T & { count: number }>();
  for (const x of items) {
    const k = key(x).trim();
    const hit = m.get(k);
    if (hit) hit.count++;
    else m.set(k, { ...x, count: 1 });
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}

export async function agentReport(agentId: number, from: Date, to: Date) {
  const [agent] = await db.select().from(qaAgentsTable).where(eq(qaAgentsTable.id, agentId));
  if (!agent) return null;
  const rows = await loadEvaluations(from, to, agentId);
  const criteria = criteriaAverages(rows);
  const recentStrengths = rows.flatMap((r) => r.evaluation.strengths.map((s) => ({ text: s, id: r.interaction.id })));
  const recentIssues = rows.flatMap((r) =>
    r.evaluation.issues.map((x) => ({ ...x, id: r.interaction.id, channel: r.interaction.channel })),
  );
  const severityRank = { high: 0, medium: 1, low: 2 } as const;

  return {
    agent,
    target: TARGET_SCORE,
    ...stats(rows),
    criteria,
    focusAreas: weakest(criteria),
    criticalBreakdown: criticalSummary(rows),
    outcomes: countBy(rows.map((r) => r.evaluation.outcome)),
    daily: dailySeries(rows),
    strengths: groupBy(recentStrengths, (s) => s.text).slice(0, 10),
    issues: groupBy(recentIssues, (x) => x.title)
      .sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || b.count - a.count)
      .slice(0, 10),
    coachingTips: groupBy(
      rows.map((r) => ({ id: r.interaction.id, tip: r.evaluation.coachingTip })),
      (t) => t.tip,
    ).slice(0, 3),
    evaluations: rows.map(compactEval),
  };
}
