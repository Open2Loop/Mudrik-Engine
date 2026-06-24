/** Arabic copy when a user-facing LLM call has no per-user API key. */
export const BYOK_MISSING_GEMINI_AR = "أضف مفتاح Gemini الخاص بك من الإعدادات";
export const BYOK_MISSING_OPENAI_AR = "أضف مفتاح OpenAI الخاص بك من الإعدادات";

export const BYOK_API_KEY_CODE = "BYOK_API_KEY_MISSING" as const;

export const API_KEY_ONBOARDING_ACK = "munakasa_api_key_ack" as const;

export class ByokKeyMissingError extends Error {
  readonly status: number;
  readonly code = BYOK_API_KEY_CODE;

  constructor(
    message: string,
    status: number = 400,
  ) {
    super(message);
    this.name = "ByokKeyMissingError";
    this.status = status;
  }
}

export function isByokKeyMissingError(error: unknown): error is ByokKeyMissingError {
  return error instanceof ByokKeyMissingError;
}

export function byokErrorResponse(error: ByokKeyMissingError): Response {
  return Response.json(
    { error: error.message, code: error.code },
    { status: error.status },
  );
}
