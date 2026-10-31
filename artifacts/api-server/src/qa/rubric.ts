import type { QaChannel, QaCriterionResult } from "@workspace/db";

/**
 * TAM Dental QA rubric.
 *
 * Built on widely used contact-center and hospitality frameworks:
 *  - COPC CX Standard & ISO 18295 (customer contact centres): accuracy, resolution, compliance.
 *  - SQM / First Contact Resolution research: resolve the need in one contact.
 *  - Forbes Travel Guide & Ritz-Carlton "Gold Standards": warm welcome, anticipating needs,
 *    using the guest's name, a fond farewell.
 *  - Healthcare patient-experience practice (Press Ganey / HCAHPS): empathy, clarity,
 *    privacy, not over-promising clinical outcomes.
 * Each criterion is scored 1-5 by the model; the overall score is computed here.
 */

export interface Criterion {
  key: string;
  label: string;
  description: string;
  /** What a 5 looks like, used in the model's instructions and on the rubric page. */
  excellent: string;
  /** Weight per channel (sums to 100 per channel); 0 = not used on that channel. */
  weights: Record<QaChannel, number>;
}

export const CRITERIA: Criterion[] = [
  {
    key: "greeting",
    label: "الافتتاحية والترحيب",
    description: "ترحيب دافئ باسم العيادة واسم الموظفة وعرض المساعدة، وسرعة الرد الأول.",
    excellent:
      "رد سريع، تحية باسم «تام دنتال» واسم الموظفة بنبرة مبتسمة، وسؤال مفتوح «كيف أقدر أخدمك؟». في الشات: رد أول خلال دقيقة مع تحية شخصية لا قالب جامد.",
    weights: { call: 8, chat: 8 },
  },
  {
    key: "hospitality",
    label: "الضيافة والتعاطف",
    description: "دفء ولباقة، مناداة المراجع باسمه، تقدير مشاعره (خوف، ألم، استعجال).",
    excellent:
      "تستخدم اسم المراجع، تعكس مشاعره («أتفهم إن الألم مزعج»)، تطمئنه، ونبرتها نبرة مضيفة في فندق فاخر لا موظفة استقبال مستعجلة.",
    weights: { call: 15, chat: 13 },
  },
  {
    key: "discovery",
    label: "فهم الاحتياج",
    description: "أسئلة استكشافية لفهم حالة المراجع وهدفه قبل تقديم المعلومة، وعدم المقاطعة.",
    excellent:
      "تسأل عن الحالة/الهدف (ألم، تجميل، متابعة)، آخر زيارة، التفضيل للفرع والوقت والطبيب، وتلخص فهمها قبل الاقتراح.",
    weights: { call: 12, chat: 12 },
  },
  {
    key: "knowledge",
    label: "المعرفة ودقة المعلومة",
    description: "معلومات صحيحة عن الخدمات والأطباء والأسعار والتأمين والعروض دون اجتهاد.",
    excellent:
      "إجابات دقيقة وواثقة، توضح أن السعر النهائي يحدده الطبيب بعد الكشف عند الحاجة، تشرح قيمة الخدمة (الخبرة، التقنية، الضمان) لا السعر فقط.",
    weights: { call: 13, chat: 14 },
  },
  {
    key: "conversion",
    label: "تقديم الحل والحجز",
    description: "تحويل الاستفسار إلى موعد، عرض بدائل، والتعامل مع الاعتراضات (السعر، الوقت).",
    excellent:
      "تقترح موعداً محدداً بخيارين، تعالج الاعتراض بإبراز القيمة أو البدائل (تقسيط، موعد أقرب، طبيب آخر)، ولا تنهي المحادثة دون خطوة تالية.",
    weights: { call: 15, chat: 15 },
  },
  {
    key: "communication",
    label: "وضوح التواصل واللغة",
    description: "لغة مهذبة وواضحة تناسب فئة راقية، دون عامية مبتذلة أو أخطاء؛ في الشات تنسيق ورسائل مرتبة.",
    excellent:
      "جمل قصيرة واضحة، مصطلحات مبسطة، نبرة احترافية دافئة. في الشات: لا أخطاء إملائية، رسائل منظمة، إيموجي باعتدال.",
    weights: { call: 10, chat: 12 },
  },
  {
    key: "responsiveness",
    label: "سرعة الاستجابة وإدارة الوقت",
    description: "في المكالمة: آداب الانتظار والتحويل. في الشات: زمن الرد بين الرسائل وعدم ترك المراجع.",
    excellent:
      "تستأذن قبل الانتظار وتعود خلال أقل من دقيقة. في الشات: ردود متتالية خلال دقيقتين، ولا فجوات طويلة دون إشعار.",
    weights: { call: 6, chat: 8 },
  },
  {
    key: "ownership",
    label: "الملكية والمتابعة",
    description: "تتحمل مسؤولية الطلب حتى نهايته، وتلتزم بمتابعة واضحة إن لم يُحل فوراً.",
    excellent:
      "«أنا بتابع طلبك شخصياً وأرجع لك قبل الساعة 4»، تؤكد وسيلة التواصل، ولا تحيل المراجع لجهة أخرى دون تسليم كامل.",
    weights: { call: 8, chat: 6 },
  },
  {
    key: "closing",
    label: "الختام",
    description: "تلخيص ما تم الاتفاق عليه، تأكيد الموعد والتعليمات، وشكر ووداع لائق.",
    excellent:
      "تلخص (الموعد، الفرع، الطبيب، ما يحضره المراجع)، تسأل «هل في شي ثاني أقدر أخدمك فيه؟»، وتودع باسمه بعبارة دافئة.",
    weights: { call: 8, chat: 7 },
  },
  {
    key: "compliance",
    label: "الالتزام والخصوصية",
    description: "التحقق من الهوية قبل مشاركة بيانات، عدم التشخيص أو الوعود العلاجية، الالتزام بسياسات العيادة.",
    excellent:
      "لا تشارك بيانات طبية دون تحقق، لا تشخّص ولا تعد بنتيجة علاجية، تحيل الأسئلة الطبية للطبيب، وتلتزم بالأسعار والسياسات المعتمدة.",
    weights: { call: 5, chat: 5 },
  },
];

/** Critical errors: any of these caps the overall score (auto-fail practice in contact-center QA). */
export const CRITICAL_FLAGS: Record<string, string> = {
  rude: "أسلوب جاف أو غير محترم مع المراجع",
  medical_advice: "تشخيص أو نصيحة طبية/دوائية خارج صلاحية الموظفة",
  privacy: "مشاركة بيانات مراجع دون تحقق من الهوية",
  misinformation: "معلومة خاطئة جوهرية (سعر، سياسة، موعد) أو وعد لا يمكن الوفاء به",
  abandoned: "ترك المراجع دون رد أو إنهاء المحادثة دون حل أو متابعة",
};

export const CRITICAL_CAP = 40;

/** World-class contact centers target ≥ 85-90% QA scores. */
export const GRADES = [
  { min: 90, key: "excellent", label: "ممتاز — مستوى عالمي" },
  { min: 80, key: "very_good", label: "جيد جداً" },
  { min: 70, key: "good", label: "جيد" },
  { min: 60, key: "needs_work", label: "يحتاج تحسين" },
  { min: 0, key: "poor", label: "ضعيف" },
] as const;

export const TARGET_SCORE = 85;

export function gradeOf(score: number) {
  return GRADES.find((g) => score >= g.min) ?? GRADES[GRADES.length - 1]!;
}

export function criteriaFor(channel: QaChannel): Criterion[] {
  return CRITERIA.filter((c) => c.weights[channel] > 0);
}

/** Weighted 0-100 score; criteria marked not-applicable are excluded from the denominator. */
export function computeOverall(
  channel: QaChannel,
  results: QaCriterionResult[],
  criticalFlags: string[],
): number {
  let earned = 0;
  let possible = 0;
  for (const c of criteriaFor(channel)) {
    const r = results.find((x) => x.key === c.key);
    if (!r || r.score == null) continue;
    const w = c.weights[channel];
    earned += w * (Math.min(5, Math.max(1, r.score)) / 5);
    possible += w;
  }
  const raw = possible ? Math.round((earned / possible) * 100) : 0;
  return criticalFlags.length ? Math.min(raw, CRITICAL_CAP) : raw;
}

/** Plain-text rubric for the model's system prompt. Kept deterministic so it caches. */
export function rubricText(): string {
  const lines: string[] = [];
  for (const c of CRITERIA) {
    lines.push(
      `- ${c.key} — ${c.label} (وزن المكالمة ${c.weights.call}٪، وزن الشات ${c.weights.chat}٪)\n  ${c.description}\n  مستوى 5: ${c.excellent}`,
    );
  }
  return lines.join("\n");
}

export function criticalText(): string {
  return Object.entries(CRITICAL_FLAGS)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
}
