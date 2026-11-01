import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import type { QaChannel, QaCriterionResult, QaIssue } from "@workspace/db";
import { CRITERIA, CRITICAL_FLAGS, computeOverall, criticalText, rubricText } from "./rubric";

const MODEL = process.env["QA_MODEL"] ?? "claude-opus-5-5";
const EFFORT = (process.env["QA_EFFORT"] ?? "medium") as "low" | "medium" | "high";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export function evaluatorConfigured(): boolean {
  return !!(process.env["ANTHROPIC_API_KEY"] || process.env["ANTHROPIC_AUTH_TOKEN"]);
}

const SYSTEM_PROMPT = `أنت مقيّم جودة خبير لمراكز الاتصال، تعمل لصالح «تام دنتال» (TAM Dental) — مجموعة عيادات أسنان احترافية في السعودية تخدم الطبقة المتوسطة إلى العالية.
هدف الإدارة: رفع مستوى الخدمة والضيافة لموظفات الاتصال والشات إلى المعايير العالمية (COPC، ISO 18295، معايير الضيافة الفاخرة مثل Forbes Travel Guide وRitz-Carlton، وممارسات تجربة المريض في القطاع الصحي).

ستستلم نص مكالمة (مفرّغة صوتياً، قد تحتوي أخطاء تفريغ) أو محادثة شات، مع اسم الموظفة والقناة.
قيّم أداء الموظفة فقط (وليس المراجع) بإنصاف ودقة، كمدرب جودة يريد تطوير الموظفة لا معاقبتها.

## معايير التقييم (كل معيار من 1 إلى 5)
${rubricText()}

سلّم الدرجات:
5 = ممتاز بمستوى عالمي، لا ملاحظات.
4 = جيد جداً مع ملاحظة بسيطة.
3 = مقبول، أُنجز الأساس لكن بفرص تحسين واضحة.
2 = ضعيف، قصور واضح أثر على التجربة.
1 = غائب تماماً أو خاطئ.
ضع score = null إذا كان المعيار لا ينطبق فعلاً على هذه المحادثة (مثلاً: لا حاجة لانتظار في مكالمة قصيرة)، ولا تستخدمه للهروب من الحكم.

## الأخطاء الحرجة (criticalFlags)
أدرج المفتاح فقط إذا حدث الخطأ بوضوح في النص:
${criticalText()}

## قواعد الكتابة
- اكتب بالعربية الفصحى المبسطة المهنية.
- strengths: نقاط ممتازة محددة حدثت فعلاً (2-4 نقاط)، كل نقطة جملة واحدة.
- issues: المشكلات في الردود، لكل مشكلة عنوان قصير، شرح، واقتباس حرفي قصير من النص (quote) يدل عليها، ودرجة الخطورة. إن لم توجد مشكلات أعد مصفوفة فارغة.
- summary: ملخص من 2-3 جمل للمحادثة وأداء الموظفة.
- customerIntent: ماذا أراد المراجع في جملة قصيرة.
- outcome: booked (تم الحجز) | info_given (معلومات فقط) | follow_up (متابعة لاحقة) | lost (فرصة ضائعة) | complaint (شكوى) | other.
- sentiment: انطباع المراجع في نهاية المحادثة: positive | neutral | negative.
- betterReply: أهم رد كان يجب أن يكون أفضل، اكتب الصياغة المثالية التي كان يجب أن تقولها الموظفة (بنبرة سعودية مهذبة راقية). null إن لم يلزم.
- coachingTip: نصيحة تدريبية واحدة عملية للموظفة لتطبيقها غداً.
- note لكل معيار: سبب الدرجة في جملة واحدة.
- لا تخترع أحداثاً غير موجودة في النص. إذا كان النص قصيراً جداً أو غير مفهوم، قيّم المتاح واذكر ذلك في الملخص.`;

const CRITERION_KEYS = CRITERIA.map((c) => c.key);
const FLAG_KEYS = Object.keys(CRITICAL_FLAGS);

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "criteria",
    "strengths",
    "issues",
    "criticalFlags",
    "summary",
    "customerIntent",
    "outcome",
    "sentiment",
    "betterReply",
    "coachingTip",
  ],
  properties: {
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "score", "note"],
        properties: {
          key: { type: "string", enum: CRITERION_KEYS },
          score: { anyOf: [{ type: "integer", enum: [1, 2, 3, 4, 5] }, { type: "null" }] },
          note: { type: "string" },
        },
      },
    },
    strengths: { type: "array", items: { type: "string" } },
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail", "quote", "severity"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          quote: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
    criticalFlags: { type: "array", items: { type: "string", enum: FLAG_KEYS } },
    summary: { type: "string" },
    customerIntent: { type: "string" },
    outcome: {
      type: "string",
      enum: ["booked", "info_given", "follow_up", "lost", "complaint", "other"],
    },
    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
    betterReply: { anyOf: [{ type: "string" }, { type: "null" }] },
    coachingTip: { type: "string" },
  },
} as const;

const ResultSchema = z.object({
  criteria: z.array(
    z.object({ key: z.string(), score: z.number().int().min(1).max(5).nullable(), note: z.string() }),
  ),
  strengths: z.array(z.string()),
  issues: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      quote: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    }),
  ),
  criticalFlags: z.array(z.string()),
  summary: z.string(),
  customerIntent: z.string(),
  outcome: z.string(),
  sentiment: z.string(),
  betterReply: z.string().nullable(),
  coachingTip: z.string(),
});

export interface EvaluationInput {
  channel: QaChannel;
  agentName: string;
  occurredAt: Date;
  durationSec: number | null;
  transcript: string;
}

export interface EvaluationOutput {
  overall: number;
  criteria: QaCriterionResult[];
  strengths: string[];
  issues: QaIssue[];
  criticalFlags: string[];
  summary: string;
  customerIntent: string;
  outcome: string;
  sentiment: string;
  betterReply: string | null;
  coachingTip: string;
  model: string;
}

export async function evaluateInteraction(input: EvaluationInput): Promise<EvaluationOutput> {
  const channelLabel = input.channel === "call" ? "مكالمة هاتفية (منصة اتصالنا)" : "محادثة شات (واتساب/respond.io)";
  const meta = [
    `القناة: ${channelLabel}`,
    `الموظفة: ${input.agentName}`,
    `التاريخ: ${input.occurredAt.toLocaleString("ar-SA-u-ca-gregory-nu-latn", { timeZone: "Asia/Riyadh" })} (بتوقيت الرياض)`,
    input.durationSec != null ? `المدة: ${Math.round(input.durationSec / 60)} دقيقة تقريباً` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: EFFORT,
      format: { type: "json_schema", schema: OUTPUT_SCHEMA as unknown as Record<string, unknown> },
    },
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `${meta}\n\n<transcript>\n${input.transcript}\n</transcript>\n\nقيّم أداء الموظفة وفق المعايير وأعد النتيجة بصيغة JSON المطلوبة.`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("رفض النموذج تقييم هذه المحادثة");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("انقطع رد النموذج قبل اكتماله");
  }
  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const parsed = ResultSchema.parse(JSON.parse(text));

  const criteria: QaCriterionResult[] = CRITERIA.filter((c) => c.weights[input.channel] > 0).map((c) => {
    const r = parsed.criteria.find((x) => x.key === c.key);
    return { key: c.key, score: r?.score ?? null, note: r?.note ?? "" };
  });
  const criticalFlags = parsed.criticalFlags.filter((f) => FLAG_KEYS.includes(f));

  return {
    overall: computeOverall(input.channel, criteria, criticalFlags),
    criteria,
    strengths: parsed.strengths,
    issues: parsed.issues,
    criticalFlags,
    summary: parsed.summary,
    customerIntent: parsed.customerIntent,
    outcome: parsed.outcome,
    sentiment: parsed.sentiment,
    betterReply: parsed.betterReply,
    coachingTip: parsed.coachingTip,
    model: response.model,
  };
}
