import { GoogleGenerativeAI } from "@google/generative-ai";

export type ComplianceEngineModel = "gemini" | "deepseek";

function stripCodeFence(raw: string): string {
  const text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced?.[1]?.trim() || text;
}

export function resolveComplianceEngineModel(): ComplianceEngineModel {
  const fromEnv = process.env.COMPLIANCE_ENGINE_MODEL?.trim().toLowerCase();
  if (fromEnv === "deepseek") return "deepseek";
  return "gemini";
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("مفتاح Gemini غير موجود. أضف GEMINI_API_KEY في البيئة.");
  }
  const genAi = new GoogleGenerativeAI(apiKey);
  const model = genAi.getGenerativeModel({ model: "gemini-1.5-pro" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text?.trim()) {
    throw new Error("استجابة Gemini فارغة.");
  }
  return stripCodeFence(text);
}

async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("مفتاح DeepSeek غير موجود. أضف DEEPSEEK_API_KEY في البيئة.");
  }
  const base = (process.env.DEEPSEEK_API_BASE?.trim() || "https://api.deepseek.com").replace(/\/$/, "");
  const modelId = process.env.DEEPSEEK_CHAT_MODEL?.trim() || "deepseek-chat";
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "أنت محلل كراسات شروط. أعد JSON صالحاً فقط بدون أي نص إضافي.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`فشل استدعاء DeepSeek: ${res.status} ${errText}`);
  }
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("استجابة DeepSeek فارغة.");
  }
  return stripCodeFence(content);
}

export async function callComplianceModel(prompt: string): Promise<string> {
  const model = resolveComplianceEngineModel();
  if (model === "deepseek") {
    return callDeepSeek(prompt);
  }
  return callGemini(prompt);
}
