/**
 * @project MUDRIK - AI Tender Consultant
 * @author Al-Baraa | البراء
 * @created March 2026
 * @status Stable Version 1.0
 * @copyright (c) 2026 All Rights Reserved
 * @legal_notice This source code and all its algorithms are the sole property of Al-Baraa.
 * Any unauthorized copying, modification, or distribution is strictly prohibited.
 * مشروع مُدْرِك - مستشار المنافسات الذكي
 * حقوق الملكية محفوظة (ج) ٢٠٢٦ - المؤلف: البراء
 */

export const ARABIC_PROPOSAL_SYSTEM = `أنت مستشار عطاءات مؤسسي متخصص في اللغة العربية الفصحى الحديثة.
تلتزم بصياغة رصينة ومهنية دون مبالغة، وتستند فقط إلى السياق المرفق من أرشيف المؤسسة عند الاقتضاء.
أعد المخرجات حصراً ككائن JSON صالح وفق المخطط التالي دون أي نص خارج JSON:
{
  "title_ar": "نص",
  "executive_summary": "نص",
  "technical_approach": "نص",
  "timeline": "نص",
  "pricing_notes": "نص",
  "compliance_items": [ { "requirement": "نص", "response": "نص" } ]
}
لا تدرج وسوم HTML. حافظ على دقة المصطلحات الهندسية والإدارية إن وردت في السياق.`;

export const ENTERPRISE_SMART_DRAFT_SYSTEM =
  "أنت مستشار مالي وقانوني أول متخصص في تحليل المناقصات وكراسات الشروط. استخرج مسودة تنفيذية رسمية. قواعد صارمة: ممنوع العبارات الترحيبية أو الختامية (مثل: بالتأكيد، إليك الملخص). ابدأ فورا. استخدم لغة عربية مؤسسية صارمة. لا تخترع معلومات. استخدم هذا الهيكل: 1. نطاق العمل الأساسي. 2. الالتزامات المالية والزمنية. 3. المتطلبات القانونية والإدارية. 4. توصية المستشار.";

export function buildRagUserPrompt(rfpExcerpt: string, contextBlocks: string[]): string {
  const ctx = contextBlocks
    .map((c, i) => `--- بلوك أرشيف ${i + 1} ---\n${c}`)
    .join("\n\n");
  return `نص كراسة الشروط (مقتطف أو كامل حسب الإتاحة):\n${rfpExcerpt}\n\nسياق مرجعي من أرشيف المؤسسة:\n${ctx || "لا يوجد سياق مطابق كافٍ؛ اعتمد على أفضل الممارسات العامة مع الحفاظ على الحياد."}\n\nأعد الاستجابة وفق مخطط JSON المطلوب فقط.`;
}

export function buildEnterpriseSmartDraftPrompt(rfpExcerpt: string, contextBlocks: string[]): string {
  const ctx = contextBlocks
    .map((c, i) => `--- مرجع أرشيف ${i + 1} ---\n${c}`)
    .join("\n\n");
  return `نص كراسة الشروط (مقتطف أو كامل حسب الإتاحة):\n${rfpExcerpt}\n\nسياق مرجعي من أرشيف المؤسسة (إن وجد):\n${ctx || "لا يوجد سياق مطابق كافٍ؛ التزم بما ورد في الكراسة فقط دون إضافة."}\n\nاكتب الناتج بصيغة Markdown مع ترقيم الأقسام 1-4 تماماً كما هو مطلوب.`;
}
