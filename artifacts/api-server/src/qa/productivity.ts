import { and, gte, lt } from "drizzle-orm";
import { db, qaAgentsTable, qaBookingsTable, qaVolumeTable, type QaTeam } from "@workspace/db";
import { dayKey, loadEvaluations } from "./service";

/**
 * Productivity = how well an agent turns inbound contacts into bookings that actually show up.
 *
 *   inbound (calls + chats)  →  bookings created  →  showed / no-show / cancelled
 *
 * Bookings are counted by the day they were *created* (the agent's work that day), and their
 * current status is read from GHL. Bookings whose visit is still ahead are "upcoming".
 */

interface Funnel {
  bookings: number;
  showed: number;
  noshow: number;
  cancelled: number;
  upcoming: number;
}

const emptyFunnel = (): Funnel => ({ bookings: 0, showed: 0, noshow: 0, cancelled: 0, upcoming: 0 });

function add(f: Funnel, status: string) {
  f.bookings++;
  if (status === "showed") f.showed++;
  else if (status === "noshow") f.noshow++;
  else if (status === "cancelled") f.cancelled++;
  else f.upcoming++;
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);

function rates(f: Funnel, contacts: number | null) {
  return {
    showRate: pct(f.showed, f.showed + f.noshow),
    cancelRate: pct(f.cancelled, f.bookings),
    noshowRate: pct(f.noshow, f.showed + f.noshow),
    conversion: contacts ? pct(f.bookings, contacts) : null, // bookings per 100 inbound contacts
    showedPerContact: contacts ? pct(f.showed, contacts) : null,
  };
}

export async function productivity(from: Date, to: Date, team?: QaTeam) {
  const fromDay = dayKey(from);
  const toDay = dayKey(new Date(to.getTime() - 1));

  const [agents, bookings, volume, evals] = await Promise.all([
    db.select().from(qaAgentsTable),
    db
      .select()
      .from(qaBookingsTable)
      .where(and(gte(qaBookingsTable.bookedAt, from), lt(qaBookingsTable.bookedAt, to))),
    db
      .select()
      .from(qaVolumeTable)
      .where(and(gte(qaVolumeTable.day, fromDay), lt(qaVolumeTable.day, dayKeyNext(toDay)))),
    loadEvaluations(from, to),
  ]);

  const inTeam = <T extends { team: QaTeam | null }>(x: T) => !team || x.team === team;
  const scoped = bookings.filter((b) => !team || b.team === team);

  const totals = emptyFunnel();
  const online = emptyFunnel();
  const unassigned = emptyFunnel();
  const perAgent = new Map<number, Funnel>();
  const perDay = new Map<string, Funnel & { contacts: number }>();

  for (const b of scoped) {
    add(totals, b.status);
    if (b.kind === "online") add(online, b.status);
    else if (b.kind === "unassigned") add(unassigned, b.status);
    else if (b.agentId) {
      const f = perAgent.get(b.agentId) ?? emptyFunnel();
      add(f, b.status);
      perAgent.set(b.agentId, f);
    }
    const d = dayKey(b.bookedAt);
    const df = perDay.get(d) ?? { ...emptyFunnel(), contacts: 0 };
    add(df, b.status);
    perDay.set(d, df);
  }

  const vol = new Map<number, { call: number; chat: number }>();
  for (const v of volume) {
    const a = agents.find((x) => x.id === v.agentId);
    if (team && a?.team !== team) continue;
    const cur = vol.get(v.agentId) ?? { call: 0, chat: 0 };
    cur[v.channel] += v.inbound;
    vol.set(v.agentId, cur);
    const df = perDay.get(v.day) ?? { ...emptyFunnel(), contacts: 0 };
    df.contacts += v.inbound;
    perDay.set(v.day, df);
  }

  const qa = new Map<number, number[]>();
  for (const e of evals) {
    const arr = qa.get(e.agent.id) ?? [];
    arr.push(e.evaluation.overall);
    qa.set(e.agent.id, arr);
  }
  const avg = (xs?: number[]) => (xs?.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

  const rows = agents
    .filter((a) => inTeam(a) && (a.active || perAgent.has(a.id)))
    .map((a) => {
      const f = perAgent.get(a.id) ?? emptyFunnel();
      const v = vol.get(a.id);
      const contacts = v ? v.call + v.chat : null;
      return {
        id: a.id,
        name: a.name,
        team: a.team,
        calls: v?.call ?? null,
        chats: v?.chat ?? null,
        contacts,
        ...f,
        ...rates(f, contacts),
        qa: avg(qa.get(a.id)),
      };
    })
    .filter((r) => r.bookings > 0 || r.contacts || r.qa != null)
    .sort((x, y) => y.showed - x.showed || y.bookings - x.bookings);

  // Conversion only over agents whose inbound volume is known, so missing feeds don't inflate it.
  const withVolume = rows.filter((r) => r.contacts);
  const totalContacts = withVolume.reduce((s, r) => s + r.contacts!, 0);
  const staffBookings = withVolume.reduce((s, r) => s + r.bookings, 0);

  return {
    team: team ?? "all",
    volumeConnected: volume.length > 0,
    totals: { ...totals, ...rates(totals, null) },
    staff: { bookings: staffBookings, contacts: totalContacts || null, conversion: pct(staffBookings, totalContacts) },
    online: { ...online, ...rates(online, null) },
    unassigned: { ...unassigned, share: pct(unassigned.bookings, totals.bookings) },
    agents: rows,
    daily: [...perDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, f]) => ({ day, ...f })),
  };
}

export async function agentProductivity(agentId: number, from: Date, to: Date) {
  const all = await productivity(from, to);
  return all.agents.find((a) => a.id === agentId) ?? null;
}

function dayKeyNext(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
