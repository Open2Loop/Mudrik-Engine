import type { UserModelSettings } from "@/lib/model-gateway";
import { completeText } from "@/lib/model-gateway";

export const ENGINE_BINDING_FACTS_AR = `قفل المصادر (لا تستند إلى معلومات خارج ما يلي):
- نص كراسة الشروط كما يُمرَّر في طلب التوليد (إن وُجد).
- مقاطع سجل الخبرات أو الوثائق الداعمة المسترجعة في الطلب (إن وُجدت).
- الحقول الصريحة في سياق الطلب: اسم المشروع، الجهة المالكة أو الطالبة، مدة التنفيذ.

يُمنع اختلاق أو تثبيت وقائع مشروع ثابتة (جهة، طوابق، مدة، معايير أداء، أسماء مشاريع مرجعية) ما لم ترد صراحة في الكراسة أو السياق أعلاه.`;

export const ENGINE_ELITE_SYSTEM_PROMPT_AR = `MUDRIK_V8 — Act as a Senior Saudi Engineering Consultant.
اكتب بالعربية الفصحى الرسمية مع مصطلحات تقنية إنجليزية بين قوسين فقط.
يُمنع الحشو والمقدمات العامة مثل: This document aims to / It is worth noting / We strive to.
ابدأ كل فقرة ببيان تقني أو تنظيمي مباشر.
ركّز على المواصفات الفنية والامتثال لكود البناء السعودي (SBC) ومتطلبات SASO وLCGPA عند الانطباق.
اجعل المخرجات منظمة بترقيم هرمي واضح: 1.0 ثم 1.1 ثم 1.1.1 فقط.
كل مقطع يجب أن يتضمن التزاماً قابلاً للتحقق أو معياراً أو منهجية تنفيذ واضحة.`;

/** Locked system message for generation APIs. */
export const ENGINE_FULL_SYSTEM_PROMPT_AR = `${ENGINE_BINDING_FACTS_AR}\n\n${ENGINE_ELITE_SYSTEM_PROMPT_AR}`;

const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickEngine(settings: UserModelSettings): UserModelSettings {
  if (settings.generationEngine === "openai") return { ...settings, aiProvider: "openai" };
  return { ...settings, aiProvider: "gemini", generationEngine: "gemini" };
}

export async function completeGeneration(
  settings: UserModelSettings,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  return completeText(pickEngine(settings), systemPrompt, userPrompt);
}

export async function completeGenerationWithRetry(
  settings: UserModelSettings,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  let lastError: unknown = null;
  for (let i = 0; i <= MAX_RETRIES; i += 1) {
    try {
      return await completeGeneration(settings, systemPrompt, userPrompt);
    } catch (error) {
      lastError = error;
      if (i < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }
  const msg = lastError instanceof Error ? lastError.message : "فشل غير متوقع في الاتصال بمحرك التوليد.";
  throw new Error(msg);
}

