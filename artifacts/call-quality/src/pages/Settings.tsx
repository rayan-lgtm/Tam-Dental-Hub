import { useState, type FormEvent } from "react";
import { Plus, Check, X, Database, PlayCircle, PlugZap, Pencil } from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks";
import { addDays, todayKey } from "../format";
import type { Agent, Meta } from "../types";
import { Button, Card, CardTitle, Empty, ErrorBox, inputCls } from "../components/ui";

type Draft = Pick<Agent, "name" | "branch" | "respondIoId" | "ittisalnaExt">;
const emptyDraft: Draft = { name: "", branch: "", respondIoId: "", ittisalnaExt: "" };

export default function Settings({ meta, onChanged }: { meta: Meta; onChanged: () => void }) {
  const agents = useFetch<Agent[]>("/agents");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [jobDay, setJobDay] = useState(addDays(todayKey(), -1));

  const run = async (key: string, fn: () => Promise<string | void>) => {
    setBusy(key);
    setMsg(null);
    try {
      const text = await fn();
      if (text) setMsg({ ok: true, text });
      await agents.reload();
      onChanged();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "حدث خطأ" });
    } finally {
      setBusy(null);
    }
  };

  const clean = (d: Draft) => ({
    name: d.name.trim(),
    branch: d.branch?.trim() || null,
    respondIoId: d.respondIoId?.trim() || null,
    ittisalnaExt: d.ittisalnaExt?.trim() || null,
  });

  const save = (e: FormEvent) => {
    e.preventDefault();
    void run("save", async () => {
      if (editing) await api(`/agents/${editing}`, { method: "PATCH", body: clean(draft) });
      else await api("/agents", { method: "POST", body: clean(draft) });
      setDraft(emptyDraft);
      setEditing(null);
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">الإعدادات</h1>
      {msg ? (
        msg.ok ? (
          <div className="rounded-xl bg-good/10 px-4 py-3 text-sm text-good">{msg.text}</div>
        ) : (
          <ErrorBox message={msg.text} />
        )
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardTitle>الموظفات</CardTitle>
          <form onSubmit={save} className="mb-4 grid gap-2 rounded-xl bg-page p-3 sm:grid-cols-2">
            <input className={inputCls} placeholder="الاسم *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required minLength={2} />
            <input className={inputCls} placeholder="الفرع" value={draft.branch ?? ""} onChange={(e) => setDraft({ ...draft, branch: e.target.value })} />
            <input
              className={inputCls}
              placeholder="معرّف الموظفة في respond.io"
              value={draft.respondIoId ?? ""}
              onChange={(e) => setDraft({ ...draft, respondIoId: e.target.value })}
              dir="ltr"
            />
            <input
              className={inputCls}
              placeholder="رقم التحويلة في اتصالنا"
              value={draft.ittisalnaExt ?? ""}
              onChange={(e) => setDraft({ ...draft, ittisalnaExt: e.target.value })}
              dir="ltr"
            />
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" loading={busy === "save"}>
                {editing ? <Check className="size-4" /> : <Plus className="size-4" />}
                {editing ? "حفظ التعديل" : "إضافة موظفة"}
              </Button>
              {editing ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditing(null);
                    setDraft(emptyDraft);
                  }}
                >
                  إلغاء
                </Button>
              ) : null}
            </div>
          </form>
          {agents.error ? <ErrorBox message={agents.error} /> : null}
          {agents.data?.length === 0 ? (
            <Empty>لم تُضف موظفات بعد</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {agents.data?.map((a) => (
                <li key={a.id} className={`flex items-center gap-3 py-2.5 ${a.active ? "" : "opacity-50"}`}>
                  <div className="flex-1 text-sm">
                    <div className="font-semibold">{a.name}</div>
                    <div className="text-[11px] text-muted">
                      {[a.branch, a.respondIoId && `respond.io: ${a.respondIoId}`, a.ittisalnaExt && `تحويلة: ${a.ittisalnaExt}`]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </div>
                  </div>
                  <button
                    className="rounded-lg p-1.5 text-muted hover:bg-page"
                    title="تعديل"
                    onClick={() => {
                      setEditing(a.id);
                      setDraft({ name: a.name, branch: a.branch, respondIoId: a.respondIoId, ittisalnaExt: a.ittisalnaExt });
                    }}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-page"
                    onClick={() => run(`t${a.id}`, async () => void (await api(`/agents/${a.id}`, { method: "PATCH", body: { active: !a.active } })))}
                  >
                    {a.active ? (
                      <span className="inline-flex items-center gap-1"><X className="size-3" /> إيقاف</span>
                    ) : (
                      <span className="inline-flex items-center gap-1"><Check className="size-3" /> تفعيل</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>
              <span className="inline-flex items-center gap-1.5">
                <PlugZap className="size-4 text-brand" /> حالة الربط
              </span>
            </CardTitle>
            <ul className="space-y-2 text-sm">
              <StatusRow ok={meta.evaluator} label="محرك التقييم (Claude)" hint="ANTHROPIC_API_KEY" />
              <StatusRow ok={meta.transcription} label="التفريغ الصوتي للمكالمات" hint="ELEVENLABS_API_KEY" />
              <StatusRow ok={false} label="respond.io (الشات)" hint="قريباً — عبر /api/qa/ingest" />
              <StatusRow ok={false} label="اتصالنا (المكالمات)" hint="قريباً — عبر /api/qa/ingest" />
            </ul>
          </Card>

          <Card>
            <CardTitle>
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle className="size-4 text-brand" /> التقييم اليومي
              </span>
            </CardTitle>
            <p className="mb-3 text-xs leading-relaxed text-muted">
              يسحب الوكيل 3-5 عينات لكل موظفة لكل قناة من المحادثات المستلمة في اليوم المحدد ويقيّمها. يعمل تلقائياً عبر جدولة يومية، ويمكن تشغيله يدوياً هنا.
            </p>
            <div className="flex gap-2">
              <input type="date" className={inputCls} value={jobDay} onChange={(e) => setJobDay(e.target.value)} />
              <Button
                loading={busy === "job"}
                disabled={!meta.evaluator}
                onClick={() =>
                  run("job", async () => {
                    const r = await api<{ sampled: number; evaluated: number; failed: number; skipped: number }>("/jobs/daily", {
                      method: "POST",
                      body: { date: jobDay },
                    });
                    return `تم: ${r.evaluated} تقييم من ${r.sampled} عينة${r.failed ? `، فشل ${r.failed}` : ""}، وخارج العينة ${r.skipped}.`;
                  })
                }
              >
                تشغيل
              </Button>
            </div>
          </Card>

          <Card>
            <CardTitle>
              <span className="inline-flex items-center gap-1.5">
                <Database className="size-4 text-brand" /> بيانات تجريبية
              </span>
            </CardTitle>
            <p className="mb-3 text-xs leading-relaxed text-muted">
              لاستعراض اللوحة قبل الربط: تُنشئ 4 موظفات تجريبيات بتقييمات لآخر 30 يوماً. لا تؤثر على البيانات الحقيقية ويمكن حذفها.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" loading={busy === "seed"} onClick={() => run("seed", async () => {
                  await api("/demo", { method: "POST" });
                  return "تم تحميل البيانات التجريبية";
                })}>
                تحميل
              </Button>
              <Button variant="danger" loading={busy === "clear"} onClick={() => run("clear", async () => {
                  await api("/demo", { method: "DELETE" });
                  return "تم حذف البيانات التجريبية";
                })}>
                حذف
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`size-2 rounded-full ${ok ? "bg-good" : "bg-line"}`} />
      <span className="flex-1">{label}</span>
      <span className="text-[11px] text-muted" dir="ltr">
        {ok ? "مفعّل" : hint}
      </span>
    </li>
  );
}
