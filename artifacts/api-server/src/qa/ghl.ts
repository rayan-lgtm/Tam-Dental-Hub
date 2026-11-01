import { isNotNull, sql } from "drizzle-orm";
import { db, qaAgentsTable, qaBookingsTable, type QaBookingKind, type QaTeam } from "@workspace/db";

/**
 * Read-only GoHighLevel sync for bookings.
 *
 * TAM Dental books directly in DentalTap, which mirrors appointments into GHL:
 *  - Sales Calendar   → sales team bookings
 *  - Organic Calendar → customer-service team bookings
 * The appointment owner (assignedUserId) is the employee who booked. Two special owners:
 *  - the "online" user  → patient self-booked from the website / app
 *  - the "Dentaltap System" user → booked by an employee who has no GHL account yet
 * DentalTap itself is never called (its API is not scoped), only GHL with a read-only token.
 */

const BASE = process.env["GHL_BASE_URL"] ?? "https://services.leadconnectorhq.com";

// TAM Dental defaults (ids, not secrets); override with env if they change.
export const GHL = {
  locationId: process.env["GHL_LOCATION_ID"] ?? "WJDaXF8pdmyS2cFY6aiQ",
  calendars: {
    sales: process.env["GHL_SALES_CALENDAR_ID"] ?? "KcI7V4361upXCtX4qurH",
    organic: process.env["GHL_ORGANIC_CALENDAR_ID"] ?? "znpqZDhXL1Y84g7DgT0t",
  } satisfies Record<QaTeam, string>,
  onlineUserId: process.env["GHL_ONLINE_USER_ID"] ?? "z1UiuCyVUAE4rwBBlAWw",
  systemUserId: process.env["GHL_SYSTEM_USER_ID"] ?? "Xvx6gbS9t5XudJF27PTH",
};

/** Dental Shift CRM token (read-only). GHL_API_TOKEN still accepted for compatibility. */
const token = () => process.env["DENTAL_SHIFT_API_TOKEN"] ?? process.env["GHL_API_TOKEN"];
export const ghlConfigured = () => !!token();

async function ghl<T>(path: string, version: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token()}`,
      Version: version,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Dental Shift ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

interface GhlEvent {
  id: string;
  assignedUserId?: string | null;
  appointmentStatus?: string;
  title?: string;
  dateAdded: string;
  startTime: string;
  deleted?: boolean;
}

async function fetchEvents(calendarId: string, from: Date, to: Date): Promise<GhlEvent[]> {
  const out: GhlEvent[] = [];
  // Query month-sized windows to keep responses manageable.
  for (let start = from.getTime(); start < to.getTime(); start += 31 * 86400_000) {
    const end = Math.min(start + 31 * 86400_000, to.getTime());
    const q = new URLSearchParams({
      locationId: GHL.locationId,
      calendarId,
      startTime: String(start),
      endTime: String(end),
    });
    const data = await ghl<{ events?: GhlEvent[] }>(`/calendars/events?${q}`, "2021-04-15");
    out.push(...(data.events ?? []));
  }
  return out;
}

async function fetchUserName(userId: string): Promise<string> {
  try {
    const u = await ghl<{ name?: string; firstName?: string; lastName?: string }>(`/users/${userId}`, "2021-07-28");
    return u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || userId;
  } catch {
    return userId;
  }
}

export function classify(ownerId: string | null | undefined): QaBookingKind {
  if (ownerId === GHL.onlineUserId) return "online";
  if (!ownerId || ownerId === GHL.systemUserId) return "unassigned";
  return "staff";
}

/**
 * Upserts appointments whose *appointment time* falls in [from, to). Statuses (showed / no-show)
 * change after the visit, so the daily job re-syncs a rolling window.
 * Employees seen as owners for the first time are added as agents with their team.
 */
export async function syncBookings(from: Date, to: Date) {
  const agents = await db.select().from(qaAgentsTable).where(isNotNull(qaAgentsTable.ghlUserId));
  const byGhl = new Map(agents.map((a) => [a.ghlUserId!, a]));
  let upserted = 0;
  const newAgents: string[] = [];

  for (const team of ["sales", "organic"] as QaTeam[]) {
    const events = (await fetchEvents(GHL.calendars[team], from, to)).filter((e) => !e.deleted);

    for (const e of events) {
      const owner = e.assignedUserId ?? null;
      if (classify(owner) === "staff" && owner && !byGhl.has(owner)) {
        const name = await fetchUserName(owner);
        const [agent] = await db
          .insert(qaAgentsTable)
          .values({ name, ghlUserId: owner, team })
          .onConflictDoUpdate({ target: qaAgentsTable.ghlUserId, set: { ghlUserId: owner } })
          .returning();
        byGhl.set(owner, agent!);
        newAgents.push(name);
      }
    }

    const rows = events.map((e) => {
      const owner = e.assignedUserId ?? null;
      const kind = classify(owner);
      return {
        id: e.id,
        team,
        kind,
        ghlUserId: owner,
        agentId: kind === "staff" && owner ? (byGhl.get(owner)?.id ?? null) : null,
        status: e.appointmentStatus ?? "new",
        doctor: e.title?.split("|")[0]?.trim() || null,
        bookedAt: new Date(e.dateAdded),
        startTime: new Date(e.startTime),
        syncedAt: new Date(),
      };
    });
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      await db
        .insert(qaBookingsTable)
        .values(chunk)
        .onConflictDoUpdate({
          target: qaBookingsTable.id,
          set: {
            team: sqlExcluded("team"),
            kind: sqlExcluded("kind"),
            ghlUserId: sqlExcluded("ghl_user_id"),
            agentId: sqlExcluded("agent_id"),
            status: sqlExcluded("status"),
            doctor: sqlExcluded("doctor"),
            bookedAt: sqlExcluded("booked_at"),
            startTime: sqlExcluded("start_time"),
            syncedAt: sqlExcluded("synced_at"),
          },
        });
      upserted += chunk.length;
    }
  }
  return { upserted, newAgents };
}

const sqlExcluded = (col: string) => sql.raw(`excluded.${col}`);
