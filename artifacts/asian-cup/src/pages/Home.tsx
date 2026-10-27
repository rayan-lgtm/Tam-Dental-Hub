import { ChevronLeft, Info, MessageCircle, Sparkles, Trophy, Medal } from "lucide-react";
import { now, useApp } from "../store";
import { Card, SectionTitle } from "../components/ui";
import { MatchCard } from "../components/MatchCard";
import { BOARD_NAMES } from "../types";
import { countdown } from "../format";
import { CLINIC_URL, whatsappLink } from "../contact";


export default function Home() {
  const { meta, matches, me, go } = useApp();
  const stage = meta.settings.currentStage;
  const stageInfo = meta.stages.find((s) => s.id === stage)!;
  const current = me.boards[stage];
  const predicted = new Set(me.predictions.map((p) => p.matchId));
  const t = now();

  const open = matches
    .filter((m) => m.homeTeam && m.awayTeam && !m.finished && new Date(m.kickoff).getTime() > t)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const todo = open.filter((m) => !predicted.has(m.id));
  const upcoming = (todo.length ? todo : open).slice(0, 2);
  const nextKick = open[0] ? new Date(open[0].kickoff).getTime() - t : null;

  const latestWinners = [...meta.winners].reverse();
  const latestBoard = latestWinners[0]?.board;
  const shownWinners = meta.winners.filter((w) => w.board === latestBoard);

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-brand to-navy p-5 text-white">
        <Trophy className="absolute -left-4 -top-4 size-28 text-white/[0.07]" />
        <p className="text-xs text-white/75">نقاطك في {stageInfo.name}</p>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-5xl font-bold tabular-nums">{current.points}</span>
          <span className="pb-2 text-sm text-white/75">نقطة</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="rounded-full bg-white/15 px-3 py-1">
            ترتيبك: {current.rank ? `#${current.rank} من ${current.total}` : "ابدأ التوقع لتظهر في الترتيب"}
          </span>
          <button onClick={() => go("board")} className="flex items-center gap-0.5 font-semibold">
            الترتيب <ChevronLeft className="size-4" />
          </button>
        </div>
        <p className="mt-3 text-[11px] text-white/60">العدّاد يبدأ من الصفر مع كل دور جديد، ولكل دور فائزين.</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat label="الترتيب العام" value={me.boards.overall.points} rank={me.boards.overall.rank} />
        <Stat label="ترتيب المجموعات" value={me.boards.groups.points} rank={me.boards.groups.rank} />
      </div>

      {shownWinners.length > 0 && latestBoard && (
        <Card className="mt-4 border-gold/40 bg-gold-soft/50 p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-navy">
            <Sparkles className="size-4 text-gold" /> مبروك للفائزين في {BOARD_NAMES[latestBoard]}
          </p>
          <ul className="mt-2 space-y-1">
            {shownWinners.map((w) => (
              <li key={`${w.rank}-${w.participantId}`} className="flex items-center gap-2 text-sm">
                <Medal className="size-4 text-gold" />
                <span className="flex-1">{w.name}</span>
                <b className="tabular-nums">{w.points}</b>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <SectionTitle
        action={
          <button onClick={() => go("matches")} className="flex items-center text-xs font-semibold text-brand">
            كل المباريات <ChevronLeft className="size-4" />
          </button>
        }
      >
        {todo.length ? `بانتظار توقعك (${todo.length})` : "المباريات القادمة"}
      </SectionTitle>
      {nextKick !== null && (
        <p className="-mt-2 mb-3 text-xs text-muted">المباراة القادمة بعد {countdown(nextKick)}</p>
      )}
      <div className="space-y-3">
        {upcoming.length ? (
          upcoming.map((m) => <MatchCard key={m.id} match={m} showDay />)
        ) : (
          <Card className="p-6 text-center text-sm text-muted">لا توجد مباريات متاحة للتوقع حالياً</Card>
        )}
      </div>

      <button
        onClick={() => go("groups")}
        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-line bg-white p-4 text-right"
      >
        <span>
          <span className="block text-sm font-bold text-navy">توقع البطل وترتيب المجموعات</span>
          <span className="text-xs text-muted">
            البطل = {meta.rules.championBonus} نقطة • {me.groupPredictions.length}/6 مجموعات محفوظة
          </span>
        </span>
        <ChevronLeft className="size-5 text-brand" />
      </button>

      <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-l from-teal to-navy p-4 text-white">
        <p className="text-sm font-bold">ابتسامة البطل تبدأ من تام دنتال 🦷</p>
        <p className="mt-1 text-xs text-white/75">احجز موعدك واحتفل بالفوز بابتسامة واثقة</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={whatsappLink("مرحباً تام دنتال، أبغى أحجز موعد (من مسابقة توقعات كأس آسيا)")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-1.5 text-xs font-semibold text-white"
          >
            <MessageCircle className="size-3.5" /> احجز عبر واتساب
          </a>
          <a
            href={CLINIC_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-navy"
          >
            موقع تام دنتال <ChevronLeft className="size-3.5" />
          </a>
        </div>
      </div>

      <button
        onClick={() => go("rules")}
        className="mx-auto mt-5 flex items-center gap-1.5 text-xs font-semibold text-muted"
      >
        <Info className="size-4" /> طريقة احتساب النقاط والشروط
      </button>
    </div>
  );
}

function Stat({ label, value, rank }: { label: string; value: number; rank: number | null }) {
  return (
    <Card className="p-3.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums text-navy">
        {value}
        <span className="mr-1 text-[11px] font-normal text-muted">{rank ? `#${rank}` : ""}</span>
      </p>
    </Card>
  );
}
