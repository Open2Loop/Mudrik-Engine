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

export type ProposalJson = {
  title_ar: string;
  executive_summary: string;
  technical_approach: string;
  timeline: string;
  pricing_notes: string;
  compliance_items: { requirement: string; response: string }[];
};

export function normalizeProposalJson(raw: unknown): ProposalJson {
  if (!raw || typeof raw !== "object") {
    throw new Error("هيكل العرض غير صالح.");
  }
  const o = raw as Record<string, unknown>;
  const arr = Array.isArray(o.compliance_items) ? o.compliance_items : [];
  const compliance_items = arr.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      requirement: String(r.requirement ?? ""),
      response: String(r.response ?? ""),
    };
  });
  return {
    title_ar: String(o.title_ar ?? ""),
    executive_summary: String(o.executive_summary ?? ""),
    technical_approach: String(o.technical_approach ?? ""),
    timeline: String(o.timeline ?? ""),
    pricing_notes: String(o.pricing_notes ?? ""),
    compliance_items,
  };
}

export function proposalToMatrixText(p: ProposalJson): string {
  if (!p.compliance_items.length) return "لا توجد بنود امتثال مفصلة.";
  return p.compliance_items
    .map((c, i) => `${i + 1}) المتطلب: ${c.requirement}\nالاستجابة: ${c.response}`)
    .join("\n\n");
}
