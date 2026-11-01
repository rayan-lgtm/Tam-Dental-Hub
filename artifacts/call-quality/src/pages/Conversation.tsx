import { useState } from "react";
import { ArrowRight, Sparkles, AlertCircle, MessageSquareQuote, Lightbulb, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks";
import { OUTCOME_LABEL, SENTIMENT_LABEL, STATUS_LABEL, fmtDateTime, fivePct, tone } from "../format";
import type { InteractionDetail, Meta } from "../types";
import { Button, Card, CardTitle, ChannelBadge, ErrorBox, ScoreRing, Spinner } from "../components/ui";
import { SeverityTag } from "./Agent";

export default function Conversation({ id, meta }: { id: number; meta: Meta }) {
  const { data, error, loading, reload } = useFetch<InteractionDetail>(`/interactions/${id}`);
  const [busy, setBusy] = useState<"eval" | "delete" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reevaluate = async () => {
    setBusy("eval");
    setActionError(null);
    try {
      await api(`/interactions/${id}/evaluate`, { method: "POST" });
      await reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!confirm("حذف هذه المحادثة وتقييمها؟")) return;
    setBusy("delete");
    try {
      await api(`/interactions/${id}`, { method: "DELETE" });
      history.back();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "حدث خطأ");
      setBusy(null);
    }
  };

  if (error) return <ErrorBox message={error} />;
  if (!data)
    return <div className="flex justify-center py-20">{loading ? <Spinner /> : null}</div>;

  const { interaction: i, agent, evaluation: ev } = data;
  const criterion = (key: string) => meta.criteria.find((c) => c.key === key);

  return (
    <div className="space-y-4">
      <a href={`#/agent/${agent.id}`} className="inline-flex items-center gap-1 text-sm text-brand-dark hover:underline">
        <ArrowRight className="size-4" /> {agent.name}
      </a>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">تقييم {i.channel === "call" ? "مكالمة" : "محادثة شات"}</h1>
            <ChannelBadge channel={i.channel} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {agent.name} · {fmtDateTime(i.occurredAt)}
            {i.customer ? ` · المراجع: ${i.customer}` : ""}
            {i.durationSec ? ` · ${Math.round(i.durationSec / 60)} د` : ""} · {STATUS_LABEL[i.status] ?? i.status}
          </p>
        </div>
        <div className="flex gap-2">
          {i.source !== "demo" ? (
            <Button variant="ghost" onClick={reevaluate} loading={busy === "eval"} disabled={!meta.evaluator}>
              <RefreshCw className="size-4" /> إعادة التقييم
            </Button>
          ) : null}
          <Button variant="danger" onClick={remove} loading={busy === "delete"}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {actionError ? <ErrorBox message={actionError} /> : null}
      {i.error ? <ErrorBox message={i.error} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {ev ? (
            <>
              <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <ScoreRing score={ev.overall} />
                <div className="flex-1 space-y-2 text-sm">
                  <p className="leading-relaxed">{ev.summary}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-lg bg-page px-2 py-1">
                      <span className="text-muted">طلب المراجع: </span>
                      {ev.customerIntent}
                    </span>
                    <span className="rounded-lg bg-page px-2 py-1">
                      <span className="text-muted">النتيجة: </span>
                      {OUTCOME_LABEL[ev.outcome] ?? ev.outcome}
                    </span>
                    <span className="rounded-lg bg-page px-2 py-1">
                      <span className="text-muted">انطباع المراجع: </span>
                      {SENTIMENT_LABEL[ev.sentiment] ?? ev.sentiment}
                    </span>
                  </div>
                </div>
              </Card>

              {ev.criticalFlags.length ? (
                <div className="rounded-2xl border border-bad/30 bg-bad/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-bad">
                    <AlertTriangle className="size-4" /> أخطاء حرجة (الحد الأعلى للتقييم 40)
                  </div>
                  <ul className="mt-2 list-inside list-disc text-sm text-bad">
                    {ev.criticalFlags.map((f) => (
                      <li key={f}>{meta.criticalFlags[f] ?? f}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardTitle>
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="size-4 text-good" /> الأمور الممتازة
                    </span>
                  </CardTitle>
                  <ul className="space-y-2 text-sm">
                    {ev.strengths.map((s, k) => (
                      <li key={k} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-good" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card>
                  <CardTitle>
                    <span className="inline-flex items-center gap-1.5">
                      <AlertCircle className="size-4 text-warn" /> المشكلات في الردود
                    </span>
                  </CardTitle>
                  {ev.issues.length === 0 ? (
                    <p className="text-sm text-muted">لا توجد ملاحظات جوهرية.</p>
                  ) : (
                    <ul className="space-y-3 text-sm">
                      {ev.issues.map((x, k) => (
                        <li key={k}>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{x.title}</span>
                            <SeverityTag severity={x.severity} />
                          </div>
                          <p className="mt-0.5 text-muted">{x.detail}</p>
                          {x.quote ? (
                            <blockquote className="mt-1 border-s-2 border-warn/50 ps-2 text-xs text-ink/80">«{x.quote}»</blockquote>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              {ev.betterReply ? (
                <Card className="bg-brand/5">
                  <CardTitle>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquareQuote className="size-4 text-brand" /> الصياغة المثالية المقترحة
                    </span>
                  </CardTitle>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{ev.betterReply}</p>
                </Card>
              ) : null}

              <Card className="bg-gold/10">
                <div className="flex items-start gap-2 text-sm">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-gold" />
                  <div>
                    <div className="font-bold">نصيحة الغد</div>
                    <p className="mt-0.5 leading-relaxed">{ev.coachingTip}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <CardTitle>تفصيل المعايير</CardTitle>
                <ul className="divide-y divide-line">
                  {ev.criteria.map((c) => {
                    const def = criterion(c.key);
                    const t = tone(fivePct(c.score));
                    return (
                      <li key={c.key} className="flex items-start gap-3 py-2.5">
                        <span className={`tabular flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${t.soft} ${t.text}`}>
                          {c.score ?? "—"}
                        </span>
                        <div className="flex-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{def?.label ?? c.key}</span>
                            {def ? <span className="text-[10px] text-muted">وزن {def.weights[i.channel]}٪</span> : null}
                          </div>
                          <p className="text-muted">{c.score == null ? "لا ينطبق على هذه المحادثة" : c.note}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[11px] text-muted">
                  قُيّمت بواسطة {ev.model === "demo" ? "بيانات تجريبية" : ev.model} · {fmtDateTime(ev.createdAt)}
                </p>
              </Card>
            </>
          ) : (
            <Card>
              <p className="text-sm text-muted">لم تُقيّم هذه المحادثة بعد.</p>
            </Card>
          )}
        </div>

        <Card className="h-fit lg:sticky lg:top-28">
          <CardTitle>{i.channel === "call" ? "نص المكالمة" : "نص المحادثة"}</CardTitle>
          {i.recordingUrl ? (
            <audio controls src={i.recordingUrl} className="mb-3 w-full" />
          ) : null}
          <Transcript text={i.transcript} />
        </Card>
      </div>
    </div>
  );
}

function Transcript({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim());
  return (
    <div className="max-h-[70vh] space-y-2 overflow-y-auto pe-1 text-sm">
      {lines.map((l, k) => {
        const m = l.match(/^([^:：]{1,24})[:：]\s*(.*)$/);
        const isAgent = m && /موظف|agent|المتحدث 1/i.test(m[1]!);
        if (!m)
          return (
            <p key={k} className="text-center text-xs text-muted">
              {l}
            </p>
          );
        return (
          <div key={k} className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${isAgent ? "bg-brand/10" : "bg-page"}`}>
              <div className="text-[10px] font-semibold text-muted">{m[1]}</div>
              <div className="leading-relaxed">{m[2]}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
