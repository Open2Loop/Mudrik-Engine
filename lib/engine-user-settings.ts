import {
  BYOK_MISSING_GEMINI_AR,
  BYOK_MISSING_OPENAI_AR,
  ByokKeyMissingError,
} from "@/lib/byok";
import type { UserModelSettings } from "@/lib/model-gateway";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchUserModelSettings } from "@/lib/user-settings";

export type ResolvedEngineUser = {
  userId: string;
  settings: UserModelSettings;
};

export async function resolveEngineUserSettings(): Promise<ResolvedEngineUser> {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) {
    throw new ByokKeyMissingError(
      "يجب بدء جلسة لاستخدام المحرك. أعد تحميل الصفحة ثم أضف مفتاحك من الإعدادات.",
      401,
    );
  }
  const settings = await fetchUserModelSettings(supabase, userId);
  return { userId, settings };
}

export function assertGeminiApiKey(settings: UserModelSettings): string {
  const key = settings.geminiApiKey?.trim();
  if (!key) throw new ByokKeyMissingError(BYOK_MISSING_GEMINI_AR, 400);
  return key;
}

export function assertOpenAiApiKey(settings: UserModelSettings): string {
  const key = settings.modelApiKey?.trim();
  if (!key) throw new ByokKeyMissingError(BYOK_MISSING_OPENAI_AR, 400);
  return key;
}

/** Main proposal stream always uses Gemini in the current engine route. */
export function assertGenerationApiKey(settings: UserModelSettings): string {
  if (settings.generationEngine === "openai") {
    return assertOpenAiApiKey(settings);
  }
  return assertGeminiApiKey(settings);
}

/** Side-panel / auxiliary calls follow generationEngine routing. */
export function assertAuxiliaryGenerationKey(settings: UserModelSettings): void {
  if (settings.generationEngine === "openai") {
    assertOpenAiApiKey(settings);
    return;
  }
  assertGeminiApiKey(settings);
}

/** Embeddings / RAG follow aiProvider. */
export function assertEmbeddingProviderKey(settings: UserModelSettings): void {
  if (settings.aiProvider === "openai") {
    assertOpenAiApiKey(settings);
    return;
  }
  assertGeminiApiKey(settings);
}
