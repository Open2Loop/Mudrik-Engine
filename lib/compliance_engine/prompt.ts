const RFP_TEXT_CAP = 40_000;

export function buildComplianceExtractionPrompt(rfpText: string): string {
  const clipped = rfpText.trim().slice(0, RFP_TEXT_CAP);
  return [
    "أنت محلل كراسات شروط متخصص في المناقصات الحكومية.",
    "المطلوب: استخراج المعلومات بصيغة JSON صالحة فقط بدون أي شرح أو markdown.",
    "",
    "أعد كائناً JSON واحداً فقط بهذه البنية الحرفية:",
    "{",
    '  "technical_requirements": ["..."],',
    '  "mandatory_criteria": ["..."],',
    '  "execution_duration": "..."',
    "}",
    "",
    "قواعد الاستخراج:",
    "1) technical_requirements: المتطلبات التقنية القابلة للتنفيذ (أنظمة، تكامل، مواصفات أداء، أمن، بنية تحتية).",
    "2) mandatory_criteria: البنود الإلزامية الصريحة مثل (يجب، إلزامي، شرط أساسي، must).",
    "3) execution_duration: مدة التنفيذ كما وردت بالنص (مثل 12 شهراً)، وإذا لم ترد فلتكن null.",
    "4) امنع التكرار. لا تضف معلومات غير موجودة في النص.",
    "",
    "نص الكراسة:",
    clipped,
  ].join("\n");
}
