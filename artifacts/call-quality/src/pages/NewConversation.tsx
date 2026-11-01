import { useState, type FormEvent } from "react";
import { Phone, MessageCircle, Wand2 } from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks";
import type { Agent, Channel, Meta } from "../types";
import { Button, Card, ErrorBox, inputCls } from "../components/ui";

export default function NewConversation({ meta }: { meta: Meta }) {
  const agents = useFetch<Agent[]>("/agents");
  const [agentId, setAgentId] = useState("");
  const [channel, setChannel] = useState<Channel>("chat");
  const [customer, setCustomer] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ id: number }>("/interactions", {
        method: "POST",
        body: {
          agentId: Number(agentId),
          channel,
          customer: customer || undefined,
          occurredAt: occurredAt ? new Date(`${occurredAt}:00+03:00`).toISOString() : undefined,
          transcript,
          evaluate: true,
        },
      });
      window.location.hash = `/conv/${res.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const active = agents.data?.filter((a) => a.active) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">تقييم محادثة</h1>
        <p className="text-sm text-muted">
          الصق نص محادثة شات أو تفريغ مكالمة، وسيقيّمها الوكيل فوراً وفق معايير تام دنتال. (بعد الربط مع respond.io واتصالنا تُسحب العينات تلقائياً.)
        </p>
      </div>
      {!meta.evaluator ? (
        <ErrorBox message="مفتاح Claude (ANTHROPIC_API_KEY) غير مضبوط على الخادم، لن يعمل التقييم." />
      ) : null}
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-muted">الموظفة</span>
              <select className={`${inputCls} mt-1`} value={agentId} onChange={(e) => setAgentId(e.target.value)} required>
                <option value="">اختر…</option>
                {active.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {agents.data && active.length === 0 ? (
                <span className="mt-1 block text-xs text-warn">أضف الموظفات أولاً من الإعدادات.</span>
              ) : null}
            </label>
            <div>
              <span className="text-xs font-semibold text-muted">القناة</span>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {(["call", "chat"] as Channel[]).map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setChannel(c)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold ${
                      channel === c ? "border-brand bg-brand/10 text-brand-dark" : "border-line text-muted"
                    }`}
                  >
                    {c === "call" ? <Phone className="size-4" /> : <MessageCircle className="size-4" />}
                    {c === "call" ? "مكالمة" : "شات"}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-muted">اسم المراجع (اختياري)</span>
              <input className={`${inputCls} mt-1`} value={customer} onChange={(e) => setCustomer(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted">وقت المحادثة (اختياري)</span>
              <input
                type="datetime-local"
                className={`${inputCls} mt-1`}
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-muted">نص المحادثة</span>
            <textarea
              className={`${inputCls} mt-1 min-h-72 font-mono text-[13px] leading-relaxed`}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={"الموظفة: تام دنتال مساء الخير، معك نورة، كيف أقدر أخدمك؟\nالمراجع: أبغى أستفسر عن…"}
              required
              minLength={40}
            />
            <span className="mt-1 block text-[11px] text-muted">
              يُفضّل أن يبدأ كل سطر باسم المتحدث (الموظفة: / المراجع:) لتوضيح الحوار.
            </span>
          </label>
          {error ? <ErrorBox message={error} /> : null}
          <Button type="submit" loading={loading} disabled={!meta.evaluator} className="w-full sm:w-auto">
            <Wand2 className="size-4" /> {loading ? "جارٍ التحليل… (قد يستغرق دقيقة)" : "حلّل وقيّم"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
