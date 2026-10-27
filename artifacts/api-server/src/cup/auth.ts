import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, cupSessionsTable, cupParticipantsTable, type CupParticipant } from "@workspace/db";

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pin, salt, 32).toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = scryptSync(pin, salt, 32);
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createSession(participantId: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.insert(cupSessionsTable).values({ tokenHash: sha256(token), participantId });
  return token;
}

/** Saudi mobile numbers only; returns 05XXXXXXXX or null. */
export function normalizePhone(raw: string): string | null {
  const digits = raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\D/g, "");
  const local = digits.replace(/^(00966|966|0)/, "");
  return /^5\d{8}$/.test(local) ? `0${local}` : null;
}

export function toAsciiDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      participant?: CupParticipant;
    }
  }
}

export async function requireParticipant(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return void res.status(401).json({ error: "يرجى تسجيل الدخول" });
  const [row] = await db
    .select({ participant: cupParticipantsTable })
    .from(cupSessionsTable)
    .innerJoin(cupParticipantsTable, eq(cupParticipantsTable.id, cupSessionsTable.participantId))
    .where(eq(cupSessionsTable.tokenHash, sha256(token)));
  if (!row) return void res.status(401).json({ error: "انتهت الجلسة، سجّل الدخول مرة أخرى" });
  req.participant = row.participant;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env["CUP_ADMIN_KEY"];
  if (!expected) return void res.status(503).json({ error: "CUP_ADMIN_KEY is not configured" });
  const given = req.header("x-admin-key") ?? "";
  const a = Buffer.from(sha256(given));
  const b = Buffer.from(sha256(expected));
  if (!timingSafeEqual(a, b)) return void res.status(401).json({ error: "مفتاح الإدارة غير صحيح" });
  next();
}

// Simple in-memory brute-force guard for PIN logins
const failures = new Map<string, { count: number; until: number }>();
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60_000;

export function isLocked(phone: string): boolean {
  const f = failures.get(phone);
  return !!f && f.count >= MAX_FAILS && f.until > Date.now();
}

export function recordFailure(phone: string) {
  const f = failures.get(phone);
  if (!f || f.until < Date.now()) failures.set(phone, { count: 1, until: Date.now() + LOCK_MS });
  else f.count++;
}

export function clearFailures(phone: string) {
  failures.delete(phone);
}
