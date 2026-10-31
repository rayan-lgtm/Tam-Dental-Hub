import { useState } from "react";
import { useFetch, useRange } from "../hooks";
import { RANGES, STATUS_LABEL, OUTCOME_LABEL, fmtDateTime } from "../format";
import type { Agent, InteractionRow } from "../types";
import { Card, ChannelBadge, Empty, ErrorBox, ScorePill, Segmented, Spinner, inputCls } from "../components/ui";

export default function Conversations() {
  const { range, setRange, query } = useRange();
  const [agentId, setAgentId] = useState("");
  const [channel, setChannel] = useState<"" | "call" | "chat">("");
  const [status, setStatus] = useState("");
  const agents = useFetch<Agent[]>("/agents");
  const params = [query, agentId && `agentId=${agentId}`, channel && `channel=${channel}`, status && `status=${status}`]
    .filter(Boolean)
    .join("&");
  const { data, error, loading } = useFetch<InteractionRow[]>(`/interactions?${params}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">المحادثات</h1>
        <Segmented items={RANGES} value={range} onChange={setRange} />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <select className={inputCls} value={agentId} onChange={(e) => setAgentId(e.target.value)}>
          <option value="">كل الموظفات</option>
          {agents.data?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select className={inputCls} value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)}>
          <option value="">المكالمات والشات</option>
          <option value="call">المكالمات</option>
          <option value="chat">الشات</option>
        </select>
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      {error ? <ErrorBox message={error} /> : null}
      <Card className="p-0">
        {!data ? (
          <div className="flex justify-center py-16">{loading ? <Spinner /> : null}</div>
        ) : data.length === 0 ? (
          <div className="p-4">
            <Empty>لا توجد محادثات مطابقة</Empty>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {data.map((r) => (
              <li key={r.id}>
                <a href={`#/conv/${r.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-page/60">
                  <ScorePill score={r.overall} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-ink">{r.agentName}</span>
                      <ChannelBadge channel={r.channel} />
                      <span className="text-muted">{fmtDateTime(r.occurredAt)}</span>
                      <span className="rounded bg-page px-1.5 py-0.5 text-muted">
                        {r.outcome ? (OUTCOME_LABEL[r.outcome] ?? r.outcome) : (STATUS_LABEL[r.status] ?? r.status)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted">{r.summary ?? r.error ?? ""}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
