/**
 * @project MUDRIK - AI Tender Consultant
 * @author Al-Baraa | البراء
 * @created March 2026
 * @status Stable Version 1.0
 * @copyright (c) 2026 All Rights Reserved
 * @legal_notice This source code and all its algorithms are the sole property of Al-Baraa.
 * Any unauthorized copying, modification, or distribution is strictly prohibited.
 * مشروع مُدْرِك - مستشار المنافسات الذكي
 * حقوق الملكية محفوظة (ج) ٢٠٢٦ - المؤلف: البراء
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationEngine, UserModelSettings } from "@/lib/model-gateway";

export async function fetchUserModelSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<UserModelSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const ge = data?.generation_engine as string | undefined;
  const generationEngine: GenerationEngine =
    ge === "openai" ? "openai" : "gemini";

  return {
    aiProvider: data?.ai_provider === "openai" ? "openai" : "gemini",
    generationEngine,
    modelApiKey: data?.model_api_key ?? null,
    geminiApiKey: data?.gemini_api_key ?? null,
    embeddingModel: data?.embedding_model ?? "text-embedding-3-small",
    chatModel: data?.chat_model ?? "gpt-4o-mini",
  };
}

export async function upsertUserSettings(
  supabase: SupabaseClient,
  userId: string,
  fields: {
    ai_provider?: "openai" | "gemini";
    generation_engine?: "gemini" | "openai";
    model_api_key?: string | null;
    gemini_api_key?: string | null;
    embedding_model?: string;
    chat_model?: string;
  }
) {
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      updated_at: new Date().toISOString(),
      ...fields,
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(error.message);
}
