/**
 * MUDRIK_CORE_OS v7.0 — Hierarchical Recursive Generation for Volume 1 only.
 * Index: نموذج التحليل (DeepSeek-R1-class). التوسيع والمواصلة: نموذج الصياغة (Llama/Qwen-class).
 */

import {
  ENGINE_FULL_SYSTEM_PROMPT_AR,
  GatewayError,
  generateSovereignText,
  getSovereignAnalysisModel,
  getSovereignSynthesisModel,
} from "@/lib/ai-gateway";
import { sanitizeSovereignProposalOutput } from "@/lib/proposal-output-sanitize";

const RETRY_DELAY_MS = 700;
/** أرضية البروتوكول v7.0 — لا يقل عن 3000 كلمة لكل مجلد رئيس (نص عربي كثيف). */
const MIN_WORDS_VOLUME_1 = 3000;
const MAX_CONTINUATION_ROUNDS = 4;
/** Target for first expansion block under 1.1 (user-requested depth anchor). */
const FIRST_BLOCK_WORDS_HINT = 500;

export function estimateWordCount(text: string): number {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

async function generateWithRetry(userPrompt: string, modelTag: string): Promise<string> {
  try {
    return await generateSovereignText(ENGINE_FULL_SYSTEM_PROMPT_AR, userPrompt, modelTag);
  } catch (firstError) {
    if (firstError instanceof GatewayError) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return generateSovereignText(ENGINE_FULL_SYSTEM_PROMPT_AR, userPrompt, modelTag);
    }
    throw firstError;
  }
}

function buildIndexPrompt(baseContext: string, titleAr: string): string {
  return [
    "طور التوليد: الفهرسة التحضيرية للمجلد 1 فقط (Hierarchical Index — لا تكتب نص العرض الكامل بعد).",
    "",
    `عنوان المجلد: ${titleAr}`,
    "",
    baseContext,
    "",
    "المطلوب (دفعة التحليل الإنشائي — Batch 1): فهرس تنظيمي دقيق بعشرة مستويات تفصيلية على الأقل تحت الترقيم الهرمي 1.0 ثم 1.1 … حتى مستويات فرعية (مثل 1.1.1 … و1.1.1.1 عند الحاجة) يغطي كامل المجلد.",
    "كل سطر أو فقرة قصيرة: رقم الترقيم ثم عنوان الجزء فقط (بضع كلمات) بالعربية فقط — بلا عناوين إنجليزية مستقلة ولا تكرار عنوان المجلد بلغتين.",
    "لا تكتب تحليلاً كاملاً هنا؛ لا Markdown؛ لا مقدمات محادثة.",
    "أخرج الفهرس فقط دون أي عبارة مثل «إليك الفهرس».",
  ].join("\n");
}

function buildExpandFromIndexPrompt(
  baseContext: string,
  titleAr: string,
  focusAr: string,
  indexText: string,
): string {
  return [
    "طور التوليد: التوسيع الهرمي الكامل للمجلد 1 (Batch 2 — Content Expansion؛ يتلوها داخلياً Batch 3 Auditor حسب بروتوكول النظام).",
    "",
    `عنوان المجلد: ${titleAr}`,
    "",
    "تعليمات المحتوى:",
    focusAr,
    "",
    baseContext,
    "",
    "الفهرس المرجعي (اتبع هيكله؛ لا تنسخه كما هو كامل المستند — حوّله إلى نص عرض فني موسّع):",
    indexText,
    "",
    "القيود:",
    `1) الحد الأدنى للمجموع: لا يقل عن ${MIN_WORDS_VOLUME_1} كلمة من النص الفني الصِرف بالعربية؛ ممنوع فقرات كاملة بالإنجليزية إلا المصطلح بين قوسين داخل جملة عربية.`,
    `2) ابدأ بتوسيع الفقرة 1.1 (أو أول فرع تحت 1.0) بما لا يقل عن ${FIRST_BLOCK_WORDS_HINT} كلمة من التحليل الخبير، ثم أكمل باقي الفقرات بنفس العمق.`,
    "3) لكل نقطة تقنية طبّق التسلسل: القصد الاستراتيجي ← منهجية التنفيذ ← الامتثال (SBC 201، SBC 801، SASO، LCGPA، مؤشرات رؤية 2030 حسب الانطباق) ← التخفيف من المخاطر؛ وأضف حيث ينطبق بعداً مالياً أو تكلفة أو مؤشرات أداء قابلة للقياس.",
    "4) يجب أن يحتوي كل فقرة تقريباً على إسناد صريح أو ضمني لمرجع سعودي معياري (لا تكرر نفس الصياغة؛ استخدم مرادفات وتعميقاً تقنياً).",
    "5) ممنوع تكرار العناوين أو الجمل حرفياً؛ ممنوع قوالب This document provides أو أقسام إنجليزية مرقمة تعيد عنوان المجلد؛ استخدم التنويع والتعميق (Deep-Dives).",
    "6) نص عربي فصيح رسمي فقط — بلا Markdown ولا حشو محادثاتي ولا ملاحظات ميتا مثل «هذا مثال» أو «ستحتاج لملء التفاصيل».",
  ].join("\n");
}

function buildContinuationPrompt(
  baseContext: string,
  titleAr: string,
  priorBody: string,
  indexText: string,
): string {
  const tail = priorBody.length > 6000 ? priorBody.slice(-6000) : priorBody;
  return [
    "مواصلة التوسيع للمجلد 1 فقط — لا تعد الفهرس من الصفر.",
    "",
    `عنوان المجلد: ${titleAr}`,
    baseContext,
    "",
    "الفهرس الأصلي (مرجعية):",
    indexText.slice(0, 8000),
    "",
    "نهاية النص السابق (تابع من هنا دون إعادة ما سبق):",
    tail,
    "",
    `أكمل بفقرات جديدة فقط حتى يصبح إجمالي المجلد (مع ما سبق) لا يقل عن ${MIN_WORDS_VOLUME_1} كلمة. لا تكرر العناوين أو الفقرات السابقة. حافظ على الإسناد السعودي لكل فقرة جديدة.`,
  ].join("\n");
}

/**
 * Volume 1: index → full expansion → optional continuations until word floor.
 */
export async function generateVolume1Hierarchical(
  baseContext: string,
  titleAr: string,
  focusAr: string,
): Promise<string> {
  const analysisModel = getSovereignAnalysisModel();
  const synthesisModel = getSovereignSynthesisModel();

  const indexRaw = await generateWithRetry(buildIndexPrompt(baseContext, titleAr), analysisModel);
  const indexText = sanitizeSovereignProposalOutput(indexRaw);

  let body = sanitizeSovereignProposalOutput(
    await generateWithRetry(
      buildExpandFromIndexPrompt(baseContext, titleAr, focusAr, indexText),
      synthesisModel,
    ),
  );

  let rounds = 0;
  while (estimateWordCount(body) < MIN_WORDS_VOLUME_1 && rounds < MAX_CONTINUATION_ROUNDS) {
    const more = sanitizeSovereignProposalOutput(
      await generateWithRetry(
        buildContinuationPrompt(baseContext, titleAr, body, indexText),
        synthesisModel,
      ),
    );
    body = `${body}\n\n${more}`.trim();
    rounds += 1;
  }

  return body;
}
