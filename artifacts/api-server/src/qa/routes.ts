import { createHash, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { z } from "zod/v4";
import { and, desc, eq, gte, lt, or, type SQL } from "drizzle-orm";
import {
  db,
  qaAgentsTable,
  qaInteractionsTable,
  qaEvaluationsTable,
  type QaAgent,
} from "@workspace/db";
import { CRITERIA, CRITICAL_FLAGS, GRADES, TARGET_SCORE } from "./rubric";
import { evaluatorConfigured } from "./evaluator";
import { transcriptionConfigured } from "./transcribe";
import { addDays, agentReport, dayStart, evaluateById, overview, runDaily, todayKey } from "./service";
import { clearDemo, seedDemo } from "./demo";

const router: IRouter = Router();

type Handler = (req: Request, res: Response) => Promise<unknown>;
const wrap =
  (fn: Handler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch(next);
  };

const bad = (res: Response, error: string, status = 400): void => {
  res.status(status).json({ error });
};

const parse = <T>(schema: z.ZodType<T>, body: unknown, res: Response): T | null => {
  const r = schema.safeParse(body);
  if (!r.success) {
    bad(res, "البيانات المدخلة غير صحيحة");
    return null;
  }
  return r.data;
};

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const keyMatches = (given: string, expected: string) =>
  timingSafeEqual(Buffer.from(sha256(given)), Buffer.from(sha256(expected)));

/** Dashboard access: x-qa-key = QA_ADMIN_KEY. Ingest also accepts QA_INGEST_KEY (for Zapier/n8n/cron). */
function requireKey(allowIngest: boolean) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = process.env["QA_ADMIN_KEY"];
    const ingest = process.env["QA_INGEST_KEY"];
    if (!admin) return bad(res, "QA_ADMIN_KEY is not configured", 503);
    const given = req.header("x-qa-key") ?? "";
    if (keyMatches(given, admin) || (allowIngest && ingest && keyMatches(given, ingest))) return next();
    bad(res, "مفتاح الدخول غير صحيح", 401);
  };
}

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** ?from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive, Riyadh days). Defaults to month-to-date. */
function range(req: Request) {
  const today = todayKey();
  const from = dateKey.safeParse(req.query["from"]).data ?? `${today.slice(0, 8)}01`;
  const to = dateKey.safeParse(req.query["to"]).data ?? today;
  return { from: dayStart(from), to: dayStart(addDays(to, 1)) };
}

const idParam = (req: Request) => Number(req.params["id"]);

// ---------- Ingest (external platforms push conversations here) ----------

const ingestItem = z
  .object({
    channel: z.enum(["call", "chat"]),
    source: z.enum(["manual", "respond_io", "ittisalna"]).default("manual"),
    externalId: z.string().max(200).optional(),
    // Agent mapping: any one of these
    agentId: z.number().int().optional(),
    agentRespondIoId: z.string().optional(),
    agentExt: z.string().optional(),
    agentName: z.string().optional(),
    occurredAt: z.string().datetime({ offset: true }).optional(),
    durationSec: z.number().int().nonnegative().optional(),
    customer: z.string().max(120).optional(),
    transcript: z.string().max(60_000).default(""),
    recordingUrl: z.string().url().optional(),
  })
  .refine((x) => x.transcript.trim() || x.recordingUrl, { message: "transcript or recordingUrl required" });

async function resolveAgent(item: z.infer<typeof ingestItem>): Promise<QaAgent | null> {
  const conds: SQL[] = [];
  if (item.agentId) conds.push(eq(qaAgentsTable.id, item.agentId));
  if (item.agentRespondIoId) conds.push(eq(qaAgentsTable.respondIoId, item.agentRespondIoId));
  if (item.agentExt) conds.push(eq(qaAgentsTable.ittisalnaExt, item.agentExt));
  if (item.agentName) conds.push(eq(qaAgentsTable.name, item.agentName));
  if (!conds.length) return null;
  const [agent] = await db.select().from(qaAgentsTable).where(or(...conds));
  return agent ?? null;
}

router.post(
  "/ingest",
  requireKey(true),
  wrap(async (req, res) => {
    const body = parse(z.object({ items: z.array(ingestItem).min(1).max(1000) }), req.body, res);
    if (!body) return;
    let inserted = 0;
    const unmatched: string[] = [];
    for (const item of body.items) {
      const agent = await resolveAgent(item);
      if (!agent) {
        unmatched.push(item.externalId ?? item.agentName ?? item.agentExt ?? item.agentRespondIoId ?? "?");
        continue;
      }
      const rows = await db
        .insert(qaInteractionsTable)
        .values({
          agentId: agent.id,
          channel: item.channel,
          source: item.source,
          externalId: item.externalId ?? null,
          occurredAt: item.occurredAt ? new Date(item.occurredAt) : new Date(),
          durationSec: item.durationSec ?? null,
          customer: item.customer ?? null,
          transcript: item.transcript,
          recordingUrl: item.recordingUrl ?? null,
        })
        .onConflictDoNothing()
        .returning({ id: qaInteractionsTable.id });
      inserted += rows.length;
    }
    res.json({ inserted, unmatched });
  }),
);

/** Daily sampling + evaluation. Call from a scheduler once a day (e.g. 23:30 Riyadh) or from the dashboard. */
router.post(
  "/jobs/daily",
  requireKey(true),
  wrap(async (req, res) => {
    if (!evaluatorConfigured()) return bad(res, "ANTHROPIC_API_KEY غير مضبوط", 503);
    const day = dateKey.safeParse(req.body?.date).data ?? todayKey();
    res.json(await runDaily(day));
  }),
);

// ---------- Dashboard (admin) ----------

router.use(requireKey(false));

router.get("/meta", (_req, res) => {
  res.json({
    criteria: CRITERIA,
    criticalFlags: CRITICAL_FLAGS,
    grades: GRADES,
    target: TARGET_SCORE,
    evaluator: evaluatorConfigured(),
    transcription: transcriptionConfigured(),
    today: todayKey(),
  });
});

router.get(
  "/overview",
  wrap(async (req, res) => {
    const { from, to } = range(req);
    res.json(await overview(from, to));
  }),
);

router.get(
  "/agents",
  wrap(async (_req, res) => {
    res.json(await db.select().from(qaAgentsTable).orderBy(qaAgentsTable.name));
  }),
);

const agentBody = z.object({
  name: z.string().trim().min(2).max(80),
  branch: z.string().trim().max(80).nullable().optional(),
  respondIoId: z.string().trim().max(120).nullable().optional(),
  ittisalnaExt: z.string().trim().max(40).nullable().optional(),
  active: z.boolean().optional(),
});

router.post(
  "/agents",
  wrap(async (req, res) => {
    const body = parse(agentBody, req.body, res);
    if (!body) return;
    const [agent] = await db.insert(qaAgentsTable).values(body).returning();
    res.json(agent);
  }),
);

router.patch(
  "/agents/:id",
  wrap(async (req, res) => {
    const body = parse(agentBody.partial(), req.body, res);
    if (!body) return;
    const [agent] = await db.update(qaAgentsTable).set(body).where(eq(qaAgentsTable.id, idParam(req))).returning();
    if (!agent) return bad(res, "الموظفة غير موجودة", 404);
    res.json(agent);
  }),
);

router.get(
  "/agents/:id/report",
  wrap(async (req, res) => {
    const { from, to } = range(req);
    const report = await agentReport(idParam(req), from, to);
    if (!report) return bad(res, "الموظفة غير موجودة", 404);
    res.json(report);
  }),
);

router.get(
  "/interactions",
  wrap(async (req, res) => {
    const { from, to } = range(req);
    const conds: SQL[] = [gte(qaInteractionsTable.occurredAt, from), lt(qaInteractionsTable.occurredAt, to)];
    const agentId = Number(req.query["agentId"]);
    if (agentId) conds.push(eq(qaInteractionsTable.agentId, agentId));
    const channel = z.enum(["call", "chat"]).safeParse(req.query["channel"]).data;
    if (channel) conds.push(eq(qaInteractionsTable.channel, channel));
    const status = z
      .enum(["pending", "evaluating", "evaluated", "failed", "skipped"])
      .safeParse(req.query["status"]).data;
    if (status) conds.push(eq(qaInteractionsTable.status, status));

    const rows = await db
      .select({
        id: qaInteractionsTable.id,
        agentId: qaInteractionsTable.agentId,
        agentName: qaAgentsTable.name,
        channel: qaInteractionsTable.channel,
        source: qaInteractionsTable.source,
        occurredAt: qaInteractionsTable.occurredAt,
        customer: qaInteractionsTable.customer,
        status: qaInteractionsTable.status,
        error: qaInteractionsTable.error,
        overall: qaEvaluationsTable.overall,
        summary: qaEvaluationsTable.summary,
        outcome: qaEvaluationsTable.outcome,
      })
      .from(qaInteractionsTable)
      .innerJoin(qaAgentsTable, eq(qaAgentsTable.id, qaInteractionsTable.agentId))
      .leftJoin(qaEvaluationsTable, eq(qaEvaluationsTable.interactionId, qaInteractionsTable.id))
      .where(and(...conds))
      .orderBy(desc(qaInteractionsTable.occurredAt))
      .limit(300);
    res.json(rows);
  }),
);

router.get(
  "/interactions/:id",
  wrap(async (req, res) => {
    const [row] = await db
      .select({ interaction: qaInteractionsTable, agent: qaAgentsTable, evaluation: qaEvaluationsTable })
      .from(qaInteractionsTable)
      .innerJoin(qaAgentsTable, eq(qaAgentsTable.id, qaInteractionsTable.agentId))
      .leftJoin(qaEvaluationsTable, eq(qaEvaluationsTable.interactionId, qaInteractionsTable.id))
      .where(eq(qaInteractionsTable.id, idParam(req)));
    if (!row) return bad(res, "المحادثة غير موجودة", 404);
    res.json(row);
  }),
);

/** Manual entry: paste a chat or call transcript and evaluate it immediately. */
router.post(
  "/interactions",
  wrap(async (req, res) => {
    const body = parse(
      z.object({
        agentId: z.number().int(),
        channel: z.enum(["call", "chat"]),
        occurredAt: z.string().datetime({ offset: true }).optional(),
        durationSec: z.number().int().nonnegative().optional(),
        customer: z.string().max(120).optional(),
        transcript: z.string().trim().min(40).max(60_000),
        evaluate: z.boolean().default(true),
      }),
      req.body,
      res,
    );
    if (!body) return;
    if (body.evaluate && !evaluatorConfigured()) return bad(res, "ANTHROPIC_API_KEY غير مضبوط", 503);
    const [row] = await db
      .insert(qaInteractionsTable)
      .values({
        agentId: body.agentId,
        channel: body.channel,
        source: "manual",
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
        durationSec: body.durationSec ?? null,
        customer: body.customer ?? null,
        transcript: body.transcript,
      })
      .returning();
    if (body.evaluate) {
      try {
        await evaluateById(row!.id);
      } catch (err) {
        return bad(res, `تم الحفظ لكن فشل التقييم: ${err instanceof Error ? err.message : err}`, 502);
      }
    }
    res.json({ id: row!.id });
  }),
);

router.post(
  "/interactions/:id/evaluate",
  wrap(async (req, res) => {
    if (!evaluatorConfigured()) return bad(res, "ANTHROPIC_API_KEY غير مضبوط", 503);
    try {
      res.json(await evaluateById(idParam(req)));
    } catch (err) {
      bad(res, `فشل التقييم: ${err instanceof Error ? err.message : err}`, 502);
    }
  }),
);

router.delete(
  "/interactions/:id",
  wrap(async (req, res) => {
    await db.delete(qaInteractionsTable).where(eq(qaInteractionsTable.id, idParam(req)));
    res.json({ ok: true });
  }),
);

router.post(
  "/demo",
  wrap(async (_req, res) => {
    res.json(await seedDemo());
  }),
);

router.delete(
  "/demo",
  wrap(async (_req, res) => {
    await clearDemo();
    res.json({ ok: true });
  }),
);

export default router;
