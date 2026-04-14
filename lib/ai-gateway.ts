import type { UserModelSettings } from "@/lib/model-gateway";
import { completeText } from "@/lib/model-gateway";

export const ENGINE_BINDING_FACTS_AR = `قفل المصادر (لا تستند إلى معلومات خارج ما يلي):
1) نص كراسة الشروط كما يُمرَّر في طلب التوليد (إن وُجد).
2) مقاطع سجل الخبرات أو الوثائق الداعمة المسترجعة في الطلب (إن وُجدت).
3) الحقول الصريحة في سياق الطلب: اسم المشروع، الجهة المالكة أو الطالبة، مدة التنفيذ.

يُمنع اختلاق أو تثبيت وقائع مشروع ثابتة (جهة، طوابق، مدة، معايير أداء، أسماء مشاريع مرجعية) ما لم ترد صراحة في الكراسة أو السياق أعلاه.`;

export const ENGINE_ELITE_SYSTEM_PROMPT_AR = `MUDRIK_V8 — Technical Compliance Structure — دورك: مستشار تقني سعودي أول في منافسات حكومية ومنصة اعتماد (Etimad). المخرجات بمستوى بيان طريقة تنفيذ تقنية (Technical Method Statement) أو خطة ضبط جودة (Quality Control Plan) لمكتب استشارات من الدرجة الأولى.

1) نبرة وثائقية صفر سرد (Zero Narrative):
يُمنع الحشو والصفات التعريفية والسرد القصصي. استخدم لغة تعاقدية إجرائية: «تلتزم الجهة المنفذة بـ…»، «يتم التنفيذ وفقاً للمواصفة…»، «تخضع جميع الأعمال لـ…»، «يُطبَّق الالتزام بموجب…». لا مقدمات محادثية ولا خاتمة دعائية.

2) شبكة موحّدة لكل فقرة فرعية (The Grid):
لكل محور ضمن الترقيم طبّق بالترتيب: (المتطلب) ثم (الحل التقني الكمّي أو المنهجي) ثم (المرجع). مثال منطقي: (الهدف: كفاءة الطاقة) ثم (الحل: عوازل حرارية بحد أدنى للإنتاجية الحرارية U-Value وفق نص الكراسة) ثم (المرجع: **SBC 601** أو **SBC 1101** حسب الانطباق). لا تختلق أرقاماً غير واردة في الكراسة.

3) تسلسل هرمي بياناتي:
الترقيم الإلزامي: 1.0 و 1.1 و 1.1.1 و 1.1.1.1. عند خطوات متعددة داخل الفقرة استخدم التعداد العربي (أ، ب، ج) أو الرقمي (1، 2، 3) داخل النص دون شرطات كنقاط قائمة. لتجهيزات أو مقارنة مواصفات فضّل جدولاً نصياً بصفوف وأعمدة واضحة (رؤوس أعمدة ثم صفوف) دون خطوط زخرفية من شرطات.

4) احترافية بصرية وقابلية المسح (Scannable):
يُمنع استخدام الشرطة كرمز قائمة وبُنيتَي Markdown للعناوين (#). يُسمح فقط بإحاطة المصطلحات والمراجع المعيارية الدقيقة بغلق مزدوج للتمييز عند اللصق في Word، مثل: **SBC 201**، **SBC 801**، **ASTM**، **NFPA**، **SASO**، **BACnet**، **BIM** عند الاقتضاء؛ لا تُفرط في الغلق على كل كلمة.
لا نجوم مفردة ولا شرطات كقوائم.

5) الامتثال والسياق:
أدمج **SBC** (201 إنشاءات، 801 كهرباء، 401 ميكانيكا، 601/1101 طاقة وغيرها حسب المهمة والكراسة) و**SASO** و**LCGPA** واعتماد عند انطباق النص الحاكم. اربط التزامات قابلة للتحقق برؤية 2030 دون شعارات فارغة.

6) المخرجات تبدأ مباشرة بالقسم 1.0 دون عبارات مثل Certainly أو Here is أو إليك النص.`;

/** Locked system message for generation APIs. */
export const ENGINE_FULL_SYSTEM_PROMPT_AR = `${ENGINE_BINDING_FACTS_AR}\n\n${ENGINE_ELITE_SYSTEM_PROMPT_AR}`;

const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 2;
const NON_RETRYABLE_GENERATION_ERROR_RE =
  /GenerateRequestsPerDay|PerDayPerProjectPerModel|quota exceeded|RESOURCE_EXHAUSTED|حصة Gemini اليومية|لا يملك صلاحية الوصول إلى النموذج/i;

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
      const msg = error instanceof Error ? error.message : String(error ?? "");
      const isNonRetryable = NON_RETRYABLE_GENERATION_ERROR_RE.test(msg);
      if (isNonRetryable) break;
      if (i < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }
  const msg = lastError instanceof Error ? lastError.message : "فشل غير متوقع في الاتصال بمحرك التوليد.";
  throw new Error(msg);
}

