/**
 * Strips markdown fences, conversational pre/post, and parses a JSON **array** from LLM text.
 * Used by analyze-gaps, estimate-boq, generate-wbs.
 */
export function purifyAiArrayText(aiText: string): string {
  let cleanText = aiText.replace(/```json/gi, "").replace(/```/gi, "").trim();
  const idxOpenArr = cleanText.indexOf("[");
  const idxOpenObj = cleanText.indexOf("{");
  let firstBrace = -1;
  let open: "[" | "{" | null = null;
  if (idxOpenArr === -1) {
    firstBrace = idxOpenObj;
    open = firstBrace >= 0 ? "{" : null;
  } else if (idxOpenObj === -1) {
    firstBrace = idxOpenArr;
    open = "[";
  } else {
    firstBrace = Math.min(idxOpenArr, idxOpenObj);
    open = firstBrace === idxOpenArr ? "[" : "{";
  }
  if (firstBrace === -1 || open == null) {
    return cleanText;
  }
  const close = open === "[" ? "]" : "}";
  const fromRoot = cleanText.slice(firstBrace);
  const relLast = fromRoot.lastIndexOf(close);
  if (relLast === -1) {
    return cleanText;
  }
  cleanText = cleanText.substring(firstBrace, firstBrace + relLast + 1);
  return cleanText;
}

function normalizeToArray<T>(parsed: unknown): T[] {
  if (Array.isArray(parsed)) {
    return parsed as T[];
  }
  if (parsed != null && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    for (const v of Object.values(o)) {
      if (Array.isArray(v)) {
        return v as T[];
      }
    }
  }
  return [];
}

export function parseSidePanelArray<T>(rawLlm: string): T[] {
  const clean = purifyAiArrayText(rawLlm);
  const parsed: unknown = JSON.parse(clean);
  return normalizeToArray<T>(parsed);
}
