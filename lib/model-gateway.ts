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

const GEMINI_CHAT_MODEL = "gemini-2.5-flash" as const;
const GEMINI_EMBED_MODEL = "gemini-embedding-001" as const;

function resolveGeminiApiKey(settings: UserModelSettings): string | null {
  const fromEnv = process.env.GEMINI_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  return settings.geminiApiKey?.trim() || null;
}

export type AiProvider = "openai" | "gemini";

/** Proposal text generation routing (embeddings still use aiProvider). */
export type GenerationEngine = "sovereign" | "gemini" | "openai";

export type UserModelSettings = {
  aiProvider: AiProvider;
  /** Local Ollama (Llama-class, configurable) vs cloud chat models. */
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

  if (!settings.modelApiKey) {
    throw new Error("يرجى إضافة مفتاح OpenAI في الإعدادات لإتمام البحث والتضمين.");
  }
  const base = getModelBaseUrl();
  const res = await fetch(`${base}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.modelApiKey}`,
    },
    body: JSON.stringify({
      model: settings.embeddingModel,
      input: inputs,
      dimensions: EMBEDDING_VECTOR_DIMENSIONS,
    }),
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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `${systemPrompt}\n\n${userPrompt}\n\nأخرج JSON صالحاً فقط بدون أي نص إضافي أو علامات ترقيم خارج JSON.`;
    let text = "";
    try {
      const result = await model.generateContent(prompt);
      text = result.response.text();
    } catch (e) {
      logApiError("model-gateway/completeJson/gemini", e);
      const raw = e instanceof Error ? e.message : String(e ?? "");
      if (raw.includes("404") && raw.includes(GEMINI_CHAT_MODEL)) {
        throw new Error("مفتاح Gemini الحالي لا يملك صلاحية الوصول إلى نموذج gemini-2.5-flash. تحقق من تفعيل Gemini API على المشروع وأن المفتاح من Google AI Studio/Generative Language API.");
      }
      throw new Error(raw || "فشل الاتصال بخدمة Gemini.");
    }
    if (!text) throw new Error("استجابة فارغة من Gemini.");
    return text.trim();
  }

  if (!settings.modelApiKey) {
    throw new Error("يرجى إضافة مفتاح OpenAI في الإعدادات.");
  }
  const base = getModelBaseUrl();
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.modelApiKey}`,
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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `${systemPrompt}\n\n${userPrompt}`;
    let text = "";
    try {
      const result = await model.generateContent(prompt);
      text = result.response.text();
    } catch (e) {
      logApiError("model-gateway/completeText/gemini", e);
      const raw = e instanceof Error ? e.message : String(e ?? "");
      if (raw.includes("404") && raw.includes(GEMINI_CHAT_MODEL)) {
        throw new Error("مفتاح Gemini الحالي لا يملك صلاحية الوصول إلى نموذج gemini-2.5-flash. تحقق من تفعيل Gemini API على المشروع وأن المفتاح من Google AI Studio/Generative Language API.");
      }
      throw new Error(raw || "فشل الاتصال بخدمة Gemini.");
    }
    if (!text) throw new Error("استجابة فارغة من Gemini.");
    return text;
  }

  if (!settings.modelApiKey) {
    throw new Error("يرجى إضافة مفتاح OpenAI في الإعدادات.");
  }
  const base = getModelBaseUrl();
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.modelApiKey}`,
    },
    body: JSON.stringify({
      model: settings.chatModel,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
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
