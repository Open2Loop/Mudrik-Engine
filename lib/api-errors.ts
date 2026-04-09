/**
 * Standard user-facing API errors (Arabic). Log details server-side only.
 */

export const API_ERROR_UNAUTHORIZED_AR = "غير مصرح بتنفيذ هذه العملية.";
export const API_ERROR_UNEXPECTED_AR =
  "تعذر إتمام العملية. يرجى المحاولة لاحقاً أو التحقق من الاتصال.";
export const API_ERROR_VAULT_RPC_AR =
  "تعذر استرجاع مقاطع الخزنة. تحقق من الإعدادات أو أعد المحاولة.";

export function logApiError(scope: string, error: unknown): void {
  console.error(`[mudrik] ${scope}`, error);
}
