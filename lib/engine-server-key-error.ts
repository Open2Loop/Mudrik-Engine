/** Toast copy when /api/engine/generate fails because no Gemini key is set on the server. */
export const ENGINE_SERVER_GEMINI_KEY_TOAST_AR =
  "عذراً، يوجد مشكلة في مفتاح التوليد في الخادم.";

export function isEngineServerApiKeyError(
  code: string | undefined,
  errorText: string | undefined,
): boolean {
  if (code === "SERVER_API_KEY_MISSING" || code === "MISSING_KEY") return true;
  if (!errorText) return false;
  return /مفتاح\s*Gemini\s*غير\s*مضبوط|مفتاح\s*التوليد\s*غير\s*مضبوط/i.test(errorText);
}
