import { useEffect, useState } from "react";
import { Medal, Trophy } from "lucide-react";
import { api } from "../api";
import { useApp } from "../store";
import { Card, Chips, Spinner } from "../components/ui";
import { BOARD_NAMES, type Board, type LeaderRow } from "../types";

const ORDER: Board[] = ["group", "r16", "qf", "sf", "final", "groups", "overall"];
const MEDAL = ["text-gold", "text-slate-400", "text-amber-700"];

export default function Leaderboard() {
  const { meta, me } = useApp();
  const [board, setBoard] = useState<Board>(meta.settings.currentStage);
  const [data, setData] = useState<{ rows: LeaderRow[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    api<{ rows: LeaderRow[]; total: number }>(`/leaderboard?board=${board}`)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [board]);

  const winners = meta.winners.filter((w) => w.board === board);
  const mine = me.boards[board];
  const meInTop = data?.rows.some((r) => r.participantId === me.participant.id);

  return (
    <div>
      <Chips
        items={ORDER.map((b) => ({ id: b, label: BOARD_NAMES[b] }))}
        value={board}
        onChange={(v) => setBoard(v)}
      />

      {winners.length > 0 && (
        <div className="mt-4 rounded-2xl bg-gradient-to-bl from-navy to-teal p-4 text-white">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <Trophy className="size-4 text-gold" /> الفائزون في {BOARD_NAMES[board]}
          </p>
          <ul className="mt-3 space-y-1.5">
            {winners.map((w) => (
              <li key={`${w.rank}-${w.participantId}`} className="flex items-center gap-2 text-sm">
                <Medal className={`size-4 ${MEDAL[w.rank - 1] ?? "text-white/60"}`} />
                <span className="flex-1 font-medium">{w.name}</span>
                <span dir="ltr" className="text-[11px] text-white/60">
                  {w.phone}
                </span>
                <b className="tabular-nums">{w.points}</b>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card className="mt-4 flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted">ترتيبك في {BOARD_NAMES[board]}</p>
          <p className="mt-0.5 text-2xl font-bold text-navy">
            {mine.rank ? `#${mine.rank}` : "—"}
            <span className="mr-1 text-xs font-normal text-muted">من {mine.total}</span>
          </p>
        </div>
        <div className="text-left">
          <p className="text-xs text-muted">نقاطك</p>
          <p className="text-2xl font-bold tabular-nums text-brand">{mine.points}</p>
        </div>
      </Card>

      <div className="mt-4">
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        {!data && !error && (
          <div className="flex justify-center py-10">
            <Spinner className="text-brand" />
          </div>
        )}
        {data && data.rows.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">لا يوجد مشاركون في هذا الترتيب بعد</p>
        )}
        {data && data.rows.length > 0 && (
          <Card className="divide-y divide-line overflow-hidden">
            <div className="grid grid-cols-[2.5rem_1fr_3rem_3.5rem] bg-page/70 px-3 py-2 text-[11px] font-semibold text-muted">
              <span>#</span>
              <span>المشارك</span>
              <span className="text-center" title="نتائج دقيقة">
                دقيقة
              </span>
              <span className="text-left">النقاط</span>
            </div>
            {data.rows.map((r) => {
              const isMe = r.participantId === me.participant.id;
              return (
                <div
                  key={r.participantId}
                  className={`grid grid-cols-[2.5rem_1fr_3rem_3.5rem] items-center px-3 py-2.5 text-sm ${
                    isMe ? "bg-brand-soft/50" : ""
                  }`}
                >
                  <span className="flex items-center">
                    {r.rank <= 3 && r.points > 0 ? (
                      <Medal className={`size-5 ${MEDAL[r.rank - 1]}`} />
                    ) : (
                      <span className="tabular-nums text-muted">{r.rank}</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {r.name} {isMe && <span className="text-[11px] text-brand">(أنت)</span>}
                    </span>
                    <span dir="ltr" className="block text-right text-[11px] text-muted">
                      {r.phone}
                    </span>
                  </span>
                  <span className="text-center tabular-nums text-muted">{r.exact}</span>
                  <span className="text-left font-bold tabular-nums text-navy">{r.points}</span>
                </div>
              );
            })}
          </Card>
        )}
        {data && !meInTop && mine.rank && (
          <p className="mt-2 text-center text-xs text-muted">يظهر أفضل 100 مشارك فقط</p>
        )}
        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
          عند التعادل: الأكثر نتائج دقيقة، ثم الأكثر توقعات صحيحة، ثم الأكثر توقعات تأهل صحيحة.
        </p>
      </div>
    </div>
  );
}
