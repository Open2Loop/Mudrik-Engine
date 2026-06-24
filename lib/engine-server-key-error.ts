import { BYOK_API_KEY_CODE, BYOK_MISSING_GEMINI_AR } from "@/lib/byok";

/** Toast copy when engine routes reject a call without a user API key. */
export const ENGINE_SERVER_GEMINI_KEY_TOAST_AR = BYOK_MISSING_GEMINI_AR;

export function isEngineServerApiKeyError(
  code: string | undefined,
  errorText: string | undefined,
): boolean {
  if (
    code === BYOK_API_KEY_CODE ||
    code === "SERVER_API_KEY_MISSING" ||
    code === "MISSING_KEY" ||
    code === "MISSING_USER_GEMINI_KEY"
  ) {
    return true;
  }
  if (!errorText) return false;
  return (
    errorText.includes(BYOK_MISSING_GEMINI_AR) ||
    /مفتاح\s*Gemini\s*غير\s*مضبوط|مفتاح\s*التوليد\s*غير\s*مضبوط/i.test(errorText)
  );
}
