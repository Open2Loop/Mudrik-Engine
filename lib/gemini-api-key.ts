/**
 * Per-user Gemini API key candidates + probe (BYOK only — no server env fallback).
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export function collectUniqueApiKeys(
  ...candidates: (string | null | undefined)[]
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates) {
    const t = typeof c === "string" ? c.trim() : "";
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

/** User-saved key only (settings / DB). */
export function collectGeminiApiKeyCandidatesForModelGateway(settings: {
  geminiApiKey?: string | null;
}): string[] {
  return collectUniqueApiKeys(settings.geminiApiKey);
}

export function isGeminiApiKeyRejectedError(e: unknown): boolean {
  const s = e instanceof Error ? `${e.name} ${e.message}` : String(e ?? "");
  return /API_KEY_INVALID|API key not valid|invalid API key|API key expired|InvalidApiKey|FAILED_PRECONDITION.*API/i.test(
    s,
  );
}

function defaultProbeModelChain(): string[] {
  const fromEnv = process.env.GEMINI_PROBE_MODELS?.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  const preferred = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-pro";
  return collectUniqueApiKeys(
    preferred,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  );
}

export async function pickFirstWorkingGeminiApiKey(
  candidates: string[],
): Promise<string | null> {
  const probeModels = defaultProbeModelChain();
  for (let ki = 0; ki < candidates.length; ki += 1) {
    const k = candidates[ki];
    for (const mid of probeModels) {
      try {
        const model = new GoogleGenerativeAI(k).getGenerativeModel({ model: mid });
        await model.generateContent(".");
        // eslint-disable-next-line no-console
        console.log("[gemini] probe OK, model:", mid, "key prefix:", k.slice(0, 6));
        return k;
      } catch (e) {
        if (isGeminiApiKeyRejectedError(e)) {
          // eslint-disable-next-line no-console
          console.warn(
            "[gemini] probe: key rejected (or key-like error) for model",
            mid,
            "— try next probe model, then other keys if any",
          );
          continue;
        }
        // eslint-disable-next-line no-console
        console.warn("[gemini] probe: non-fatal (e.g. model 404/503) model:", mid, "— trying next probe model");
        continue;
      }
    }
  }
  return null;
}
