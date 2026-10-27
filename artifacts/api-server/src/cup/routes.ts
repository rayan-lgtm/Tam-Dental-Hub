import { createHash } from "node:crypto";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { z } from "zod/v4";
import { eq, asc } from "drizzle-orm";
import {
  db,
  cupParticipantsTable,
  cupMatchesTable,
  cupPredictionsTable,
  cupGroupPredictionsTable,
  cupChampionPredictionsTable,
  cupGroupResultsTable,
  cupSessionsTable,
} from "@workspace/db";
import {
  TEAMS,
  GROUPS,
  STAGES,
  STAGE_NAMES,
  STAGE_POINTS,
  QUALIFIER_BONUS,
  CHAMPION_BONUS,
  GROUP_POSITION_POINTS,
  TEAM_CODES,
  ADVANCES_TO,
} from "./data";
import { BOARDS, scorePrediction, scoreGroupOrder, type Board } from "./scoring";
import {
  ensureSeed,
  getSettings,
  setSettings,
  getStandings,
  invalidateStandings,
  announceWinners,
  getWinners,
  maskPhone,
} from "./store";
import {
  hashPin,
  verifyPin,
  createSession,
  normalizePhone,
  toAsciiDigits,
  requireParticipant,
  requireAdmin,
  isLocked,
  recordFailure,
  clearFailures,
} from "./auth";

const router: IRouter = Router();

type Handler = (req: Request, res: Response) => Promise<unknown>;
const wrap =
  (fn: Handler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch(next);
  };

router.use((_req, _res, next) => {
  ensureSeed().then(() => next(), next);
});

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

// ---------- Public ----------

router.get(
  "/meta",
  wrap(async (_req, res) => {
    const [settings, winners] = await Promise.all([getSettings(), getWinners()]);
    res.json({
      serverTime: new Date().toISOString(),
      teams: TEAMS,
      groups: GROUPS,
      stages: STAGES.map((s) => ({ id: s, name: STAGE_NAMES[s], ...STAGE_POINTS[s] })),
      rules: {
        qualifierBonus: QUALIFIER_BONUS,
        championBonus: CHAMPION_BONUS,
        groupPositionPoints: GROUP_POSITION_POINTS,
      },
      settings,
      winners: winners.map(({ phone, ...w }) => ({ ...w, phone: maskPhone(phone) })),
    });
  }),
);

router.get(
  "/matches",
  wrap(async (_req, res) => {
    const matches = await db.select().from(cupMatchesTable).orderBy(asc(cupMatchesTable.id));
    res.json(matches);
  }),
);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().max(20),
  pin: z.string().max(10),
});

router.post(
  "/register",
  wrap(async (req, res) => {
    const body = parse(registerSchema, req.body, res);
    if (!body) return;
    const phone = normalizePhone(body.phone);
    if (!phone) return bad(res, "رقم الجوال يجب أن يكون سعودياً ويبدأ بـ 05");
    const pin = toAsciiDigits(body.pin);
    if (!/^\d{4}$/.test(pin)) return bad(res, "الرقم السري يجب أن يكون 4 أرقام");
    const [existing] = await db
      .select({ id: cupParticipantsTable.id })
      .from(cupParticipantsTable)
      .where(eq(cupParticipantsTable.phone, phone));
    if (existing) return bad(res, "هذا الرقم مسجّل مسبقاً، سجّل الدخول بدلاً من ذلك", 409);
    const [p] = await db
      .insert(cupParticipantsTable)
      .values({ name: body.name, phone, pinHash: hashPin(pin) })
      .returning();
    invalidateStandings();
    res.json({ token: await createSession(p!.id), participant: { id: p!.id, name: p!.name, phone } });
  }),
);

const loginSchema = z.object({ phone: z.string().max(20), pin: z.string().max(10) });

router.post(
  "/login",
  wrap(async (req, res) => {
    const body = parse(loginSchema, req.body, res);
    if (!body) return;
    const phone = normalizePhone(body.phone);
    if (!phone) return bad(res, "رقم الجوال غير صحيح");
    if (isLocked(phone)) return bad(res, "محاولات كثيرة، حاول بعد 15 دقيقة", 429);
    const [p] = await db.select().from(cupParticipantsTable).where(eq(cupParticipantsTable.phone, phone));
    if (!p || !verifyPin(toAsciiDigits(body.pin), p.pinHash)) {
      recordFailure(phone);
      return bad(res, "رقم الجوال أو الرقم السري غير صحيح", 401);
    }
    clearFailures(phone);
    res.json({ token: await createSession(p.id), participant: { id: p.id, name: p.name, phone } });
  }),
);

router.get(
  "/leaderboard",
  wrap(async (req, res) => {
    const board = String(req.query["board"] ?? "overall") as Board;
    if (!BOARDS.includes(board)) return bad(res, "لوحة غير معروفة");
    const standings = await getStandings();
    const rows = standings.ranked.get(board) ?? [];
    res.json({
      board,
      total: rows.length,
      rows: rows.slice(0, 100).map((r) => ({
        ...r,
        name: standings.names.get(r.participantId)?.name ?? "",
        phone: maskPhone(standings.names.get(r.participantId)?.phone ?? ""),
      })),
    });
  }),
);

// ---------- Participant ----------

router.get(
  "/me",
  requireParticipant,
  wrap(async (req, res) => {
    const me = req.participant!;
    const [matches, predictions, groupPredictions, champion, groupResults, standings, settings] =
      await Promise.all([
        db.select().from(cupMatchesTable),
        db.select().from(cupPredictionsTable).where(eq(cupPredictionsTable.participantId, me.id)),
        db.select().from(cupGroupPredictionsTable).where(eq(cupGroupPredictionsTable.participantId, me.id)),
        db.select().from(cupChampionPredictionsTable).where(eq(cupChampionPredictionsTable.participantId, me.id)),
        db.select().from(cupGroupResultsTable),
        getStandings(),
        getSettings(),
      ]);
    const matchById = new Map(matches.map((m) => [m.id, m]));
    const resultByGroup = new Map(groupResults.map((r) => [r.groupLetter, r.teams]));
    const boards: Record<string, { points: number; rank: number | null; total: number }> = {};
    for (const b of BOARDS) {
      const rows = standings.ranked.get(b) ?? [];
      const row = rows.find((r) => r.participantId === me.id);
      boards[b] = { points: row?.points ?? 0, rank: row?.rank ?? null, total: rows.length };
    }
    res.json({
      participant: { id: me.id, name: me.name, phone: me.phone },
      boards,
      predictions: predictions.map((p) => ({
        matchId: p.matchId,
        homeScore: p.homeScore,
        awayScore: p.awayScore,
        qualifier: p.qualifier,
        score: scorePrediction(matchById.get(p.matchId)!, p),
      })),
      groupPredictions: groupPredictions.map((g) => {
        const actual = resultByGroup.get(g.groupLetter);
        return {
          group: g.groupLetter,
          teams: g.teams,
          points: actual ? scoreGroupOrder(g.teams, actual) : null,
        };
      }),
      champion: champion[0]?.team ?? null,
      championCorrect: settings.champion ? champion[0]?.team === settings.champion : null,
    });
  }),
);

const scoreInt = z.number().int().min(0).max(20);
const predictionSchema = z.object({
  homeScore: scoreInt,
  awayScore: scoreInt,
  qualifier: z.string().nullable().optional(),
});

router.put(
  "/predictions/:matchId",
  requireParticipant,
  wrap(async (req, res) => {
    const body = parse(predictionSchema, req.body, res);
    if (!body) return;
    const matchId = Number(req.params["matchId"]);
    const [match] = await db.select().from(cupMatchesTable).where(eq(cupMatchesTable.id, matchId));
    if (!match) return bad(res, "المباراة غير موجودة", 404);
    if (!match.homeTeam || !match.awayTeam) return bad(res, "لم يتم تحديد طرفي المباراة بعد");
    if (match.finished || match.kickoff.getTime() <= Date.now())
      return bad(res, "انتهى وقت التوقع لهذه المباراة", 403);

    let qualifier: string | null = null;
    if (match.stage !== "group") {
      if (body.homeScore > body.awayScore) qualifier = match.homeTeam;
      else if (body.awayScore > body.homeScore) qualifier = match.awayTeam;
      else if (body.qualifier === match.homeTeam || body.qualifier === match.awayTeam)
        qualifier = body.qualifier;
      else return bad(res, "اختر المنتخب المتأهل في حال التعادل");
    }

    const values = {
      participantId: req.participant!.id,
      matchId,
      homeScore: body.homeScore,
      awayScore: body.awayScore,
      qualifier,
      updatedAt: new Date(),
    };
    await db
      .insert(cupPredictionsTable)
      .values(values)
      .onConflictDoUpdate({
        target: [cupPredictionsTable.participantId, cupPredictionsTable.matchId],
        set: { homeScore: values.homeScore, awayScore: values.awayScore, qualifier, updatedAt: values.updatedAt },
      });
    invalidateStandings();
    res.json({ ok: true, qualifier });
  }),
);

const groupOrderSchema = z.object({ teams: z.array(z.string()).length(4) });

function validGroupOrder(group: string, teams: string[]): boolean {
  const members = TEAMS.filter((t) => t.group === group).map((t) => t.code);
  return members.length === 4 && new Set(teams).size === 4 && teams.every((t) => members.includes(t));
}

router.put(
  "/group-predictions/:group",
  requireParticipant,
  wrap(async (req, res) => {
    const body = parse(groupOrderSchema, req.body, res);
    if (!body) return;
    const group = String(req.params["group"]).toUpperCase();
    if (!validGroupOrder(group, body.teams)) return bad(res, "ترتيب المجموعة غير صحيح");
    const settings = await getSettings();
    if (new Date(settings.groupsDeadline).getTime() <= Date.now())
      return bad(res, "انتهى وقت توقع ترتيب المجموعات", 403);
    await db
      .insert(cupGroupPredictionsTable)
      .values({ participantId: req.participant!.id, groupLetter: group, teams: body.teams })
      .onConflictDoUpdate({
        target: [cupGroupPredictionsTable.participantId, cupGroupPredictionsTable.groupLetter],
        set: { teams: body.teams, updatedAt: new Date() },
      });
    invalidateStandings();
    res.json({ ok: true });
  }),
);

router.put(
  "/champion",
  requireParticipant,
  wrap(async (req, res) => {
    const body = parse(z.object({ team: z.string() }), req.body, res);
    if (!body) return;
    if (!TEAM_CODES.has(body.team)) return bad(res, "منتخب غير معروف");
    const settings = await getSettings();
    if (new Date(settings.championDeadline).getTime() <= Date.now())
      return bad(res, "انتهى وقت توقع بطل البطولة", 403);
    await db
      .insert(cupChampionPredictionsTable)
      .values({ participantId: req.participant!.id, team: body.team })
      .onConflictDoUpdate({
        target: cupChampionPredictionsTable.participantId,
        set: { team: body.team, updatedAt: new Date() },
      });
    invalidateStandings();
    res.json({ ok: true });
  }),
);

router.post(
  "/logout",
  wrap(async (req, res) => {
    const header = req.header("authorization") ?? "";
    if (header.startsWith("Bearer ")) {
      const hash = createHash("sha256").update(header.slice(7)).digest("hex");
      await db.delete(cupSessionsTable).where(eq(cupSessionsTable.tokenHash, hash));
    }
    res.json({ ok: true });
  }),
);

// ---------- Admin ----------

const admin: IRouter = Router();
admin.use(requireAdmin);

admin.get("/check", (_req, res) => {
  res.json({ ok: true });
});

const teamCode = z.string().nullable().optional();
const matchUpdateSchema = z.object({
  homeTeam: teamCode,
  awayTeam: teamCode,
  kickoff: z.string().optional(),
  homeScore: scoreInt.nullable().optional(),
  awayScore: scoreInt.nullable().optional(),
  qualifier: teamCode,
  finished: z.boolean().optional(),
});

admin.put(
  "/matches/:id",
  wrap(async (req, res) => {
    const body = parse(matchUpdateSchema, req.body, res);
    if (!body) return;
    const id = Number(req.params["id"]);
    const [match] = await db.select().from(cupMatchesTable).where(eq(cupMatchesTable.id, id));
    if (!match) return bad(res, "المباراة غير موجودة", 404);

    const next = { ...match };
    for (const key of ["homeTeam", "awayTeam", "qualifier"] as const) {
      const v = body[key];
      if (v === undefined) continue;
      if (v !== null && !TEAM_CODES.has(v)) return bad(res, "منتخب غير معروف");
      next[key] = v;
    }
    if (body.homeScore !== undefined) next.homeScore = body.homeScore;
    if (body.awayScore !== undefined) next.awayScore = body.awayScore;
    if (body.finished !== undefined) next.finished = body.finished;
    if (body.kickoff !== undefined) {
      const d = new Date(body.kickoff);
      if (Number.isNaN(d.getTime())) return bad(res, "تاريخ غير صحيح");
      next.kickoff = d;
    }

    if (next.finished) {
      if (next.homeScore == null || next.awayScore == null) return bad(res, "أدخل النتيجة أولاً");
      if (!next.homeTeam || !next.awayTeam) return bad(res, "حدد طرفي المباراة أولاً");
      if (next.stage === "group") next.qualifier = null;
      else {
        if (next.homeScore > next.awayScore) next.qualifier = next.homeTeam;
        else if (next.awayScore > next.homeScore) next.qualifier = next.awayTeam;
        if (next.qualifier !== next.homeTeam && next.qualifier !== next.awayTeam)
          return bad(res, "حدد المنتخب المتأهل (ركلات ترجيح / أشواط إضافية)");
      }
    }

    const { id: _id, ...set } = next;
    await db.transaction(async (tx) => {
      await tx.update(cupMatchesTable).set(set).where(eq(cupMatchesTable.id, id));
      const adv = ADVANCES_TO[id];
      if (adv && next.finished && next.qualifier) {
        const [target, side] = adv;
        await tx
          .update(cupMatchesTable)
          .set(side === "home" ? { homeTeam: next.qualifier } : { awayTeam: next.qualifier })
          .where(eq(cupMatchesTable.id, target));
      }
    });
    invalidateStandings();
    res.json({ ok: true });
  }),
);

admin.put(
  "/group-results/:group",
  wrap(async (req, res) => {
    const body = parse(groupOrderSchema, req.body, res);
    if (!body) return;
    const group = String(req.params["group"]).toUpperCase();
    if (!validGroupOrder(group, body.teams)) return bad(res, "ترتيب المجموعة غير صحيح");
    await db
      .insert(cupGroupResultsTable)
      .values({ groupLetter: group, teams: body.teams })
      .onConflictDoUpdate({ target: cupGroupResultsTable.groupLetter, set: { teams: body.teams } });
    invalidateStandings();
    res.json({ ok: true });
  }),
);

admin.delete(
  "/group-results/:group",
  wrap(async (req, res) => {
    const group = String(req.params["group"]).toUpperCase();
    await db.delete(cupGroupResultsTable).where(eq(cupGroupResultsTable.groupLetter, group));
    invalidateStandings();
    res.json({ ok: true });
  }),
);

admin.get(
  "/group-results",
  wrap(async (_req, res) => {
    res.json(await db.select().from(cupGroupResultsTable));
  }),
);

const isoDate = z.string().refine((s) => !Number.isNaN(new Date(s).getTime()));
const settingsSchema = z.object({
  currentStage: z.enum(["group", "r16", "qf", "sf", "final"]).optional(),
  champion: z.string().nullable().optional(),
  championDeadline: isoDate.optional(),
  groupsDeadline: isoDate.optional(),
});

admin.put(
  "/settings",
  wrap(async (req, res) => {
    const body = parse(settingsSchema, req.body, res);
    if (!body) return;
    if (body.champion && !TEAM_CODES.has(body.champion)) return bad(res, "منتخب غير معروف");
    await setSettings(body);
    res.json(await getSettings());
  }),
);

admin.post(
  "/winners/:board",
  wrap(async (req, res) => {
    const board = String(req.params["board"]) as Board;
    if (!BOARDS.includes(board)) return bad(res, "لوحة غير معروفة");
    const count = await announceWinners(board);
    res.json({ ok: true, count });
  }),
);

admin.get(
  "/participants",
  wrap(async (_req, res) => {
    const [people, standings] = await Promise.all([
      db.select().from(cupParticipantsTable).orderBy(asc(cupParticipantsTable.id)),
      getStandings(),
    ]);
    const pointsFor = (b: Board, id: number) =>
      standings.ranked.get(b)?.find((r) => r.participantId === id);
    res.json(
      people.map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        createdAt: p.createdAt,
        boards: Object.fromEntries(
          BOARDS.map((b) => {
            const r = pointsFor(b, p.id);
            return [b, r ? { points: r.points, rank: r.rank } : null];
          }),
        ),
      })),
    );
  }),
);

admin.get(
  "/winners",
  wrap(async (_req, res) => {
    res.json(await getWinners());
  }),
);

admin.post(
  "/participants/:id/reset-pin",
  wrap(async (req, res) => {
    const body = parse(z.object({ pin: z.string() }), req.body, res);
    if (!body) return;
    const pin = toAsciiDigits(body.pin);
    if (!/^\d{4}$/.test(pin)) return bad(res, "الرقم السري يجب أن يكون 4 أرقام");
    const id = Number(req.params["id"]);
    await db.update(cupParticipantsTable).set({ pinHash: hashPin(pin) }).where(eq(cupParticipantsTable.id, id));
    await db.delete(cupSessionsTable).where(eq(cupSessionsTable.participantId, id));
    res.json({ ok: true });
  }),
);

router.use("/admin", admin);

export default router;
