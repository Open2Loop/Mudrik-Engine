export type ComplianceExtractionResult = {
  technical_requirements: string[];
  mandatory_criteria: string[];
  execution_duration: string | null;
};

function asStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`الحقل ${fieldName} يجب أن يكون مصفوفة نصية.`);
  }
  const cleaned = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  return Array.from(new Set(cleaned));
}

export function normalizeComplianceExtractionResult(raw: unknown): ComplianceExtractionResult {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("صيغة النتيجة غير صالحة: الكائن الأساسي مفقود.");
  }
  const obj = raw as Record<string, unknown>;

  const technicalRequirements = asStringArray(obj.technical_requirements, "technical_requirements");
  const mandatoryCriteria = asStringArray(obj.mandatory_criteria, "mandatory_criteria");

  const executionDurationRaw = obj.execution_duration;
  const executionDuration =
    typeof executionDurationRaw === "string"
      ? executionDurationRaw.trim() || null
      : executionDurationRaw == null
        ? null
        : null;

  return {
    technical_requirements: technicalRequirements,
    mandatory_criteria: mandatoryCriteria,
    execution_duration: executionDuration,
  };
}
