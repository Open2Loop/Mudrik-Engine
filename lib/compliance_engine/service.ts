import { buildComplianceExtractionPrompt } from "@/lib/compliance_engine/prompt";
import { extractTextFromPdfBuffer } from "@/lib/compliance_engine/pdf";
import { callComplianceModel, resolveComplianceEngineModel } from "@/lib/compliance_engine/llm";
import { normalizeComplianceExtractionResult, type ComplianceExtractionResult } from "@/lib/compliance_engine/types";

function parseJsonFromModel(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("النموذج أعاد ناتجاً غير صالح كـ JSON.");
  }
}

export type ComplianceExtractionServiceResult = {
  provider: "gemini" | "deepseek";
  data: ComplianceExtractionResult;
  source_char_count: number;
};

export async function extractComplianceFromPdf(buffer: Buffer): Promise<ComplianceExtractionServiceResult> {
  const text = await extractTextFromPdfBuffer(buffer);
  const prompt = buildComplianceExtractionPrompt(text);
  const raw = await callComplianceModel(prompt);
  const parsed = parseJsonFromModel(raw);
  const normalized = normalizeComplianceExtractionResult(parsed);

  return {
    provider: resolveComplianceEngineModel(),
    data: normalized,
    source_char_count: text.length,
  };
}
