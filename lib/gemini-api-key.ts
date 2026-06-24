/**
 * Deduplicated Gemini API key candidates + probe so we fail fast (HTTP 400)
 * before streaming, and can fall back when GOOGLE_API_KEY is set but invalid
 * while GEMINI_API_KEY (or user_settings) is valid.
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

/** Server env: same order as model-gateway (first wins in legacy, here we may probe all). */
export function collectEnvGeminiApiKeyCandidates(): string[] {
  return collectUniqueApiKeys(
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GEMINI_API_KEY,
  );
}

/**
 * Prefer the user-saved key first (settings / DB), then server env in the same
 * order as legacy: GOOGLE_API_KEY → GOOGLE_GENERATIVE_AI_API_KEY → GEMINI_API_KEY.
 * Dedupes identical keys so a valid key from settings is not shadowed by a
 * stale duplicate in .env.
 */
export function collectGeminiApiKeyCandidatesForModelGateway(settings: {
  geminiApiKey?: string | null;
}): string[] {
  return collectUniqueApiKeys(
    settings.geminiApiKey,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GEMINI_API_KEY,
  );
}

export function isGeminiApiKeyRejectedError(e: unknown): boolean {
  const s = e instanceof Error ? `${e.name} ${e.message}` : String(e ?? "");
  return /API_KEY_INVALID|API key not valid|invalid API key|API key expired|InvalidApiKey|FAILED_PRECONDITION.*API/i.test(
    s,
  );
}

/**
 * Models used to verify a key. Prefer `GEMINI_MODEL` first so the probe matches
 * what `/api/clean-generate` and the engine use (default gemini-2.5-pro), not only legacy flash IDs.
 */
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

/**
 * Tries each candidate with a tiny request; returns the first that Google accepts.
 * If only one key exists and it is bad, returns null.
 */
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
          /* Try all probe models: first model may 401 while another ID still works; same for truly bad keys (all will fail). */
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
