/**
 * Shared prompt assembly for /api/engine/generate and /api/clean-generate.
 */
import { WRITER_AGENT_PROMPT, QA_AGENT_PROMPT } from "@/lib/ai/prompts";

export const RFP_CAP = 28_000;
export const DOCS_CAP = 14_000;

export const UNIFIED_SYSTEM_PROMPT = [
  WRITER_AGENT_PROMPT,
  "",
  "══════════════════════════════════════════════════════════════",
  "  self-audit في أثناء الصياغة (دمج دور المدقق القانوني)",
  "══════════════════════════════════════════════════════════════",
  QA_AGENT_PROMPT,
].join("\n");

export function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeGenerateDocs(docs: unknown): string {
  if (Array.isArray(docs)) {
    return docs
      .map((d) => (typeof d === "string" ? d.trim() : ""))
      .filter(Boolean)
      .join("\n\n════════════════════════\n\n");
  }
  return toText(docs);
}

export function buildUserPrompt(
  rfpText: string,
  companyDocs: string,
  meta: { projectName: string; ownerEntity: string; executionDuration: string },
): string {
  const lines: string[] = [];
  const hasAnyMeta = meta.projectName || meta.ownerEntity || meta.executionDuration;
  if (hasAnyMeta) {
    lines.push("══ بيانات المشروع (مُقيَّد بها — لا تختلق بيانات مغايرة) ══");
    if (meta.projectName) lines.push(`اسم المشروع    : ${meta.projectName}`);
    if (meta.ownerEntity) lines.push(`الجهة المالكة  : ${meta.ownerEntity}`);
    if (meta.executionDuration) lines.push(`مدة التنفيذ    : ${meta.executionDuration}`);
    lines.push("");
  }
  lines.push(
    "══ تذكير قفل المصادر ══",
    "استند حصراً إلى نص الكراسة ووثائق الشركة أدناه.",
    "لا تختلق أرقاماً أو جهات أو مراجع معيارية غير واردة في هذا النص.",
    "",
    "— انطلق مباشرة بكتابة العرض ابتداءً من 1.0 —",
    "",
    "══════════════════════════════════════════════",
    "       نص كراسة الشروط والمواصفات            ",
    "     (المرجع الحاكم الإلزامي — لا تتجاوزه)  ",
    "══════════════════════════════════════════════",
    rfpText.slice(0, RFP_CAP),
  );
  if (companyDocs) {
    lines.push(
      "",
      "══════════════════════════════════════════════",
      "       وثائق الشركة وسجل الخبرات             ",
      "   (استند إليها لدعم العرض — لا تتجاوزها)   ",
      "══════════════════════════════════════════════",
      companyDocs.slice(0, DOCS_CAP),
    );
  }
  return lines.join("\n");
}
