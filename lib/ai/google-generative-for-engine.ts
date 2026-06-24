import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { GoogleGenerativeAIProvider } from "@ai-sdk/google";
import { BYOK_MISSING_GEMINI_AR } from "@/lib/byok";

/**
 * Resolves the Google (Gemini) provider for the engine from the user's saved key.
 */
export function getGoogleGenerativeAIForEngine(
  geminiApiKey: string | null | undefined,
): GoogleGenerativeAIProvider {
  const apiKey = geminiApiKey?.trim();
  if (!apiKey) {
    throw new Error(BYOK_MISSING_GEMINI_AR);
  }
  return createGoogleGenerativeAI({ apiKey });
}
