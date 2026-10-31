import { eq, inArray } from "drizzle-orm";
import {
  db,
  qaAgentsTable,
  qaInteractionsTable,
  qaEvaluationsTable,
  type QaChannel,
  type QaCriterionResult,
  type QaIssue,
} from "@workspace/db";
import { computeOverall, criteriaFor } from "./rubric";
import { addDays, dayStart, todayKey } from "./service";

// Synthetic data so the dashboard can be previewed before respond.io / Ittisalna are wired.
// Everything here is tagged source = "demo" and can be removed from the dashboard.

const DEMO_AGENTS = [
  { name: "نورة (تجريبي)", branch: "الرياض — العليا", base: 4.4 },
  { name: "ريم (تجريبي)", branch: "الرياض — الملقا", base: 3.9 },
  { name: "سارة (تجريبي)", branch: "جدة — الروضة", base: 3.4 },
  { name: "هيفاء (تجريبي)", branch: "الرياض — العليا", base: 2.9 },
];

const TRANSCRIPTS: Record<QaChannel, string[]> = {
  call: [
    `الموظفة: تام دنتال مساء الخير، معك نورة، كيف أقدر أخدمك؟
المراجع: مساء النور، أبغى أستفسر عن تبييض الأسنان.
الموظفة: أكيد، تشرفنا. ممكن أعرف اسمك الكريم؟
المراجع: عبدالله.
الموظفة: أهلاً أستاذ عبدالله. هل سبق سويت تبييض قبل؟ وهل عندك حساسية في الأسنان؟
المراجع: لا أول مرة، وما عندي حساسية.
الموظفة: ممتاز. عندنا تبييض بالليزر في جلسة وحدة تقريباً ساعة، والطبيب يسوي فحص قبلها يتأكد إن اللثة والأسنان جاهزة. السعر يبدأ من ١٢٠٠ ريال ويحدده الطبيب بعد الفحص.
المراجع: طيب متى أقرب موعد؟
الموظفة: عندي بكرة الساعة ٥ مع د. خالد أو الخميس الساعة ٧، أيهم يناسبك؟
المراجع: بكرة ٥.
الموظفة: تم يا أستاذ عبدالله، موعدك بكرة الأحد الساعة ٥ في فرع العليا مع د. خالد، بيوصلك تأكيد على الواتساب. تحتاج شي ثاني؟
المراجع: لا شكراً.
الموظفة: الله يسعدك، ننتظرك بكرة، مع السلامة.`,
    `الموظفة: ألو تام دنتال.
المراجع: السلام عليكم، عندي ألم قوي في ضرس من أمس.
الموظفة: وعليكم السلام، طيب عندنا مواعيد الأسبوع الجاي.
المراجع: الأسبوع الجاي؟ أنا متألم مرة.
الموظفة: الدكاترة مشغولين، تقدر تجي وتنتظر بس ما أضمن لك.
المراجع: طيب كم الكشف؟
الموظفة: ٢٠٠.
المراجع: خلاص أشوف.
الموظفة: أوكي.`,
  ],
  chat: [
    `المراجعة: السلام عليكم، كم سعر التقويم الشفاف؟
الموظفة: وعليكم السلام ورحمة الله، أهلاً فيك في تام دنتال 🌷 معك ريم. التقويم الشفاف يختلف سعره حسب الحالة ومدة العلاج، ويبدأ من ٩٥٠٠ ريال مع إمكانية التقسيط.
الموظفة: عشان أعطيك تصور أدق، هل سبق ركبتي تقويم؟ وش أكثر شي يضايقك في أسنانك؟
المراجعة: لا أول مرة، عندي ازدحام بسيط تحت.
الموظفة: الازدحام البسيط غالباً يتعالج بالشفاف بنتائج ممتازة. الخطوة الأولى استشارة مع أخصائية التقويم د. لمى مع أشعة وتصوير ثلاثي الأبعاد تشوفين فيه النتيجة المتوقعة قبل البدء.
المراجعة: حلو، متى؟
الموظفة: متاح الثلاثاء ٤:٣٠ أو الأربعاء ٦، وش يناسبك؟`,
    `المراجع: عندكم تنظيف اليوم؟
الموظفة: ايه
المراجع: كم؟
(بعد ٤٠ دقيقة)
الموظفة: ٣٥٠
المراجع: طيب متى فيه موعد
(لا يوجد رد)`,
  ],
};

const STRENGTHS = [
  "رحبت باسم العيادة واسمها بنبرة دافئة",
  "استخدمت اسم المراجع أكثر من مرة",
  "سألت أسئلة استكشافية قبل إعطاء السعر",
  "شرحت قيمة الخدمة وليس السعر فقط",
  "عرضت موعدين محددين لتسهيل القرار",
  "لخصت تفاصيل الموعد في الختام",
];

const ISSUES: QaIssue[] = [
  {
    title: "إعطاء السعر دون شرح القيمة",
    detail: "ذُكر السعر مباشرة دون توضيح ما يشمله أو مميزات العيادة، مما يجعل المقارنة على السعر فقط.",
    quote: "٣٥٠",
    severity: "medium",
  },
  {
    title: "تأخر الرد في الشات",
    detail: "فجوة طويلة بين الرسائل أفقدت المراجع الاهتمام.",
    quote: "(بعد ٤٠ دقيقة)",
    severity: "high",
  },
  {
    title: "لم تعرض بديلاً لحالة الألم",
    detail: "مراجع متألم كان يحتاج موعد طوارئ أو قائمة انتظار، لا تأجيل لأسبوع.",
    quote: "عندنا مواعيد الأسبوع الجاي",
    severity: "high",
  },
  {
    title: "افتتاحية مقتضبة",
    detail: "لم تذكر اسمها ولم تعرض المساعدة.",
    quote: "ألو تام دنتال",
    severity: "low",
  },
  {
    title: "ختام دون خطوة تالية",
    detail: "انتهت المحادثة دون حجز أو متابعة أو دعوة للتواصل.",
    quote: "أوكي",
    severity: "medium",
  },
];

const OUTCOMES = ["booked", "booked", "info_given", "follow_up", "lost"];

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]!;

export async function seedDemo(days = 30) {
  await clearDemo();
  const agents = await db
    .insert(qaAgentsTable)
    .values(DEMO_AGENTS.map((a) => ({ name: a.name, branch: a.branch })))
    .returning();

  const today = todayKey();
  for (const [idx, agent] of agents.entries()) {
    const base = DEMO_AGENTS[idx]!.base;
    // Each agent gets her own profile of strong and weak criteria.
    const bias = Object.fromEntries(criteriaFor("call").map((c) => [c.key, rand(-0.9, 0.6)]));
    for (let d = days - 1; d >= 0; d--) {
      const day = addDays(today, -d);
      // Agents improve slightly over the month — that's the point of daily coaching.
      const drift = ((days - d) / days) * 0.4;
      for (const channel of ["call", "chat"] as QaChannel[]) {
        const n = 3 + Math.floor(Math.random() * 3);
        for (let k = 0; k < n; k++) {
          const level = Math.min(5, Math.max(1, base + drift + rand(-0.9, 0.7)));
          const good = level >= 3.6;
          const occurredAt = new Date(dayStart(day).getTime() + (9 + rand(0, 12)) * 3600_000);
          const [interaction] = await db
            .insert(qaInteractionsTable)
            .values({
              agentId: agent.id,
              channel,
              source: "demo",
              externalId: `demo-${agent.id}-${day}-${channel}-${k}`,
              occurredAt,
              durationSec: channel === "call" ? Math.round(rand(90, 420)) : null,
              customer: pick(["عبدالله", "منيرة", "فهد", "لمى", "سلطان", "جود"]),
              transcript: TRANSCRIPTS[channel][good ? 0 : 1]!,
              status: "evaluated",
            })
            .returning();

          const criteria: QaCriterionResult[] = criteriaFor(channel).map((c) => ({
            key: c.key,
            score: Math.round(Math.min(5, Math.max(1, level + bias[c.key]! + rand(-0.8, 0.8)))),
            note: "بيانات تجريبية",
          }));
          const flags = level < 2.2 && Math.random() < 0.4 ? [pick(["abandoned", "misinformation", "rude"])] : [];
          await db.insert(qaEvaluationsTable).values({
            interactionId: interaction!.id,
            overall: computeOverall(channel, criteria, flags),
            criteria,
            strengths: good ? [pick(STRENGTHS), pick(STRENGTHS)] : [pick(STRENGTHS)],
            issues: good ? (Math.random() < 0.5 ? [pick(ISSUES)] : []) : [pick(ISSUES), pick(ISSUES)],
            criticalFlags: flags,
            summary: good
              ? "محادثة احترافية بترحيب دافئ وفهم جيد للاحتياج، انتهت بحجز موعد واضح."
              : "رد مقتضب يفتقر للضيافة، لم يُفهم احتياج المراجع ولم تُعرض خطوة تالية.",
            customerIntent: channel === "call" ? "حجز موعد علاج" : "الاستفسار عن سعر خدمة",
            outcome: good ? pick(OUTCOMES.slice(0, 3)) : pick(["lost", "info_given", "follow_up"]),
            sentiment: good ? "positive" : pick(["neutral", "negative"]),
            betterReply: good
              ? null
              : "أهلاً وسهلاً فيك في تام دنتال، معك [الاسم] 🌷 أتفهم تماماً إن الألم مزعج، خليني أشوف لك أقرب موعد طوارئ اليوم، تناسبك الساعة ٧ مساءً؟",
            coachingTip: good
              ? "استمري على نفس النهج وجربي اقتراح خدمة مكملة (مثل التنظيف) بشكل لبق."
              : "ابدئي كل محادثة بالترحيب واسمك، واسألي سؤالاً واحداً لفهم الحالة قبل إعطاء السعر.",
            model: "demo",
          });
        }
      }
    }
  }
  return { agents: agents.length };
}

export async function clearDemo() {
  const demoAgents = await db
    .selectDistinct({ id: qaInteractionsTable.agentId })
    .from(qaInteractionsTable)
    .where(eq(qaInteractionsTable.source, "demo"));
  await db.delete(qaInteractionsTable).where(eq(qaInteractionsTable.source, "demo"));
  const ids = demoAgents.map((a) => a.id);
  if (ids.length) {
    // Only remove agents that have no real data left
    const stillUsed = await db
      .selectDistinct({ id: qaInteractionsTable.agentId })
      .from(qaInteractionsTable)
      .where(inArray(qaInteractionsTable.agentId, ids));
    const used = new Set(stillUsed.map((u) => u.id));
    const removable = ids.filter((id) => !used.has(id));
    if (removable.length) await db.delete(qaAgentsTable).where(inArray(qaAgentsTable.id, removable));
  }
}
