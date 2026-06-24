import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { GoogleGenerativeAIProvider } from "@ai-sdk/google";
import { collectEnvGeminiApiKeyCandidates } from "@/lib/gemini-api-key";

/**
 * First non-empty key among server env vars (for legacy callers that don't probe).
 * Prefer `pickFirstWorkingGeminiApiKey` in routes when you need a valid key.
 */
function resolveEngineApiKeyFromEnv(): string | null {
  const keys = collectEnvGeminiApiKeyCandidates();
  return keys[0] ?? null;
}

/**
 * Resolves the Google (Gemini) provider for the engine.
 * `userId` is reserved for a future per-user key from the database.
 */
export function getGoogleGenerativeAIForEngine(
  _userId: string | null | undefined,
): GoogleGenerativeAIProvider {
  const apiKey = resolveEngineApiKeyFromEnv();
  const hasGoogle = Boolean(process.env.GOOGLE_API_KEY?.trim());
  console.log("🛠️ ENGINE: Key Status =", hasGoogle || apiKey ? "READY" : "MISSING");
  if (!apiKey) {
    throw new Error("MISSING_GOOGLE_API_KEY");
  }
  return createGoogleGenerativeAI({ apiKey });
}

export function hasServerGeminiApiKeyInEnv(): boolean {
  return collectEnvGeminiApiKeyCandidates().length > 0;
}
