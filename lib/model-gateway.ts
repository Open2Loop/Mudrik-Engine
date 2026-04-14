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

import { logApiError } from "@/lib/api-errors";
import { assertEmbeddingVector, EMBEDDING_VECTOR_DIMENSIONS } from "@/lib/embedding-config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_GEMINI_CHAT_MODEL = "gemini-2.5-flash";
const GEMINI_EMBED_MODEL = "gemini-embedding-001" as const;

type GeminiChatModelHandle = ReturnType<InstanceType<typeof GoogleGenerativeAI>["getGenerativeModel"]>;

function resolveGeminiChatModelId(): string {
  const m = process.env.GEMINI_CHAT_MODEL?.trim();
  return m && m.length > 0 ? m : DEFAULT_GEMINI_CHAT_MODEL;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Free tier daily caps (e.g. GenerateRequestsPerDayPerModel) — retrying soon does not help. */
function isGeminiDailyQuotaMessage(raw: string): boolean {
  return (
    /GenerateRequestsPerDay|PerDayPerProjectPerModel|RequestsPerDay|GenerateRequestsPerDayPerModel/i.test(raw) ||
    /quotaId.*PerDay/i.test(raw)
  );
}

function isGemini429Status(e: unknown, raw: string): boolean {
  if (/429|Too Many Requests|RESOURCE_EXHAUSTED/i.test(raw)) return true;
  if (typeof e === "object" && e !== null && "status" in e) {
    const s = (e as { status?: number }).status;
    if (s === 429) return true;
  }
  return false;
}

/**
 * Retries transient 429s (e.g. per-minute). Stops immediately on daily free-tier exhaustion with a clear Arabic message.
 */
async function generateGeminiTextWith429Retry(
  model: GeminiChatModelHandle,
  prompt: string,
  modelId: string,
  logLabel: string,
): Promise<string> {
  const rawMax = process.env.GEMINI_429_MAX_RETRIES?.trim();
  const parsed = rawMax ? Number(rawMax) : NaN;
  const maxAttempts = Number.isFinite(parsed) && parsed >= 1 ? Math.min(12, Math.floor(parsed)) : 5;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) throw new Error("استجابة فارغة من Gemini.");
      return text;
    } catch (e) {
      lastError = e;
      const raw = e instanceof Error ? e.message : String(e ?? "");
      logApiError(`${logLabel}/attempt-${attempt + 1}`, e);

      if (isGeminiDailyQuotaMessage(raw)) {
        throw new Error(
          `حصة Gemini اليومية المجانية لهذا النموذج (${modelId}) مستنفدة لهذا المفتاح (حدّ الطبقة المجانية، مثلاً طلبات/يوم لكل نموذج). الحلول: (1) الانتظار حتى إعادة تعيين الحصة اليومية (2) تفعيل الفوترة في Google AI Studio / Google Cloud (3) تعيين GEMINI_CHAT_MODEL في .env.local إلى نموذج آخر قد تكون حصته منفصلة، مثل gemini-2.0-flash حسب التوفر في حسابك (4) استخدام محرك OpenAI من الإعدادات. https://ai.google.dev/gemini-api/docs/rate-limits`,
        );
      }

      if (raw.includes("404") && raw.includes(modelId)) {
        throw new Error(
          `مفتاح Gemini الحالي لا يملك صلاحية الوصول إلى النموذج ${modelId}. تحقق من التفعيل أو غيّر GEMINI_CHAT_MODEL.`,
        );
      }

      const is429 = isGemini429Status(e, raw);
      if (!is429 || attempt >= maxAttempts - 1) {
        throw new Error(raw || "فشل الاتصال بخدمة Gemini.");
      }

      let waitMs = Math.min(120_000, 4000 * (attempt + 1));
      const retryIn = /Please retry in ([\d.]+)\s*s/i.exec(raw);
      if (retryIn) {
        const sec = parseFloat(retryIn[1]);
        if (Number.isFinite(sec)) waitMs = Math.min(120_000, Math.ceil(sec * 1000) + 800);
      }
      await sleep(waitMs);
    }
  }
  const msg = lastError instanceof Error ? lastError.message : String(lastError ?? "");
  throw new Error(msg || "فشل الاتصال بخدمة Gemini.");
}

/** Per upstream HTTP call (OpenAI-compatible). Gemini SDK uses its own transport. */
function getOpenAiCompatibleTimeoutMs(): number {
  const raw = process.env.MUDRIK_CLOUD_FETCH_TIMEOUT_MS?.trim();
  const n = raw ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 30_000) return Math.min(Math.floor(n), 580_000);
  return 540_000;
}

function openAiCompatibleSignal(): AbortSignal | undefined {
  const ms = getOpenAiCompatibleTimeoutMs();
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  return undefined;
}

function resolveGeminiApiKey(settings: UserModelSettings): string | null {
  const fromEnv = process.env.GEMINI_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  return settings.geminiApiKey?.trim() || null;
}

/** Same precedence as Gemini: server .env first, then saved user settings. */
function resolveOpenAiApiKey(settings: UserModelSettings): string | null {
  const fromEnv = process.env.OPENAI_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  return settings.modelApiKey?.trim() || null;
}

export type AiProvider = "openai" | "gemini";

/** Proposal text generation routing (cloud only). */
export type GenerationEngine = "gemini" | "openai";

export type UserModelSettings = {
  aiProvider: AiProvider;
  /** Direct cloud generation engine. */
  generationEngine: GenerationEngine;
  modelApiKey: string | null;
  geminiApiKey: string | null;
  embeddingModel: string;
  chatModel: string;
};

export function getModelBaseUrl(): string {
  const base = process.env.MODEL_API_BASE?.trim();
  if (!base) {
    throw new Error("لم يُعرّف عنوان واجهة النماذج في الخادم (MODEL_API_BASE).");
  }
  return base.replace(/\/$/, "");
}

export async function embedTexts(
  settings: UserModelSettings,
  inputs: string[]
): Promise<number[][]> {
  if (settings.aiProvider === "gemini") {
    const apiKey = resolveGeminiApiKey(settings);
    if (!apiKey) {
      throw new Error("CRITICAL: Gemini API Key is missing from both settings and .env file.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_EMBED_MODEL });
    const vectors: number[][] = [];
    for (let i = 0; i < inputs.length; i += 1) {
      const input = inputs[i] ?? "";
      try {
        const res = await model.embedContent(input);
        const v = res.embedding?.values ?? [];
        assertEmbeddingVector(v, `دفعة ${i + 1}`);
        vectors.push(v);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "فشل إنشاء التضمينات عبر Gemini.";
        logApiError(`model-gateway/embedTexts/gemini-batch-${i + 1}`, msg);
        throw new Error(msg);
      }
    }
    return vectors;
  }

  const openAiKey = resolveOpenAiApiKey(settings);
  if (!openAiKey) {
    throw new Error(
      "يرجى إضافة مفتاح OpenAI في الإعدادات أو تعيين OPENAI_API_KEY في ملف البيئة لإتمام البحث والتضمين.",
    );
  }
  const base = getModelBaseUrl();
  const res = await fetch(`${base}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: settings.embeddingModel,
      input: inputs,
      dimensions: EMBEDDING_VECTOR_DIMENSIONS,
    }),
    signal: openAiCompatibleSignal(),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`فشل إنشاء التضمينات: ${res.status} ${errText}`);
  }
  const body = (await res.json()) as {
    data: { embedding: number[] }[];
  };
  return body.data.map((d, i) => {
    const v = d.embedding;
    assertEmbeddingVector(v, `دفعة ${i + 1}`);
    return v;
  });
}

export async function embedQuery(settings: UserModelSettings, text: string): Promise<number[]> {
  const vectors = await embedTexts(settings, [text]);
  return vectors[0] ?? [];
}

export async function completeJson(
  settings: UserModelSettings,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (settings.aiProvider === "gemini") {
    const apiKey = resolveGeminiApiKey(settings);
    if (!apiKey) {
      throw new Error("CRITICAL: Gemini API Key is missing from both settings and .env file.");
    }
    const modelId = resolveGeminiChatModelId();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });
    const prompt = `${systemPrompt}\n\n${userPrompt}\n\nأخرج JSON صالحاً فقط بدون أي نص إضافي أو علامات ترقيم خارج JSON.`;
    const text = await generateGeminiTextWith429Retry(model, prompt, modelId, "model-gateway/completeJson/gemini");
    return text.trim();
  }

  const openAiKeyJson = resolveOpenAiApiKey(settings);
  if (!openAiKeyJson) {
    throw new Error("يرجى إضافة مفتاح OpenAI في الإعدادات أو تعيين OPENAI_API_KEY في ملف البيئة.");
  }
  const base = getModelBaseUrl();
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKeyJson}`,
    },
    body: JSON.stringify({
      model: settings.chatModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: openAiCompatibleSignal(),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`فشل توليد الاستجابة: ${res.status} ${errText}`);
  }
  const body = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = body.choices[0]?.message?.content;
  if (!content) throw new Error("استجابة فارغة من النموذج.");
  return content;
}

export async function completeText(
  settings: UserModelSettings,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (settings.aiProvider === "gemini") {
    const apiKey = resolveGeminiApiKey(settings);
    if (!apiKey) {
      throw new Error("CRITICAL: Gemini API Key is missing from both settings and .env file.");
    }
    const modelId = resolveGeminiChatModelId();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });
    const prompt = `${systemPrompt}\n\n${userPrompt}`;
    return generateGeminiTextWith429Retry(model, prompt, modelId, "model-gateway/completeText/gemini");
  }

  const openAiKeyChat = resolveOpenAiApiKey(settings);
  if (!openAiKeyChat) {
    throw new Error("يرجى إضافة مفتاح OpenAI في الإعدادات أو تعيين OPENAI_API_KEY في ملف البيئة.");
  }
  const base = getModelBaseUrl();
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKeyChat}`,
    },
    body: JSON.stringify({
      model: settings.chatModel,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: openAiCompatibleSignal(),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`فشل توليد الاستجابة: ${res.status} ${errText}`);
  }
  const body = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = body.choices[0]?.message?.content;
  if (!content) throw new Error("استجابة فارغة من النموذج.");
  return content;
}
