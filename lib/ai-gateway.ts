/**
 * @project MUDRIK - AI Tender Consultant
 * Primary: sovereign Ollama Llama 3.1 70B. Cloud (Gemini/OpenAI) only when user settings or fallback require it.
 */

import type { UserModelSettings } from "@/lib/model-gateway";
import { completeText } from "@/lib/model-gateway";

/**
 * Binding tender facts — woven into narrative; no [cite] in final output (stripped server-side).
 * قفل المصادر: الوثيقتان المعتمدتان فقط هما كراسة الشروط المستخرجة وسجل الخبرات المسترجع في الطلب.
 */
export const ENGINE_BINDING_FACTS_AR = `قفل المصادر (لا تستند إلى معلومات خارج ما يلي):
- نص كراسة_شروط_مشروع_المبنى_الذكي.docx كما يُمرَّر في الطلب (المقاطع ~٣٨–٧٨ في الملف المنظم).
- مقاطع سجل_خبرات_الشركة.docx المسترجعة في الطلب (المقاطع ~١–٣٧ في الملف المنظم).

وقائع ملزمة يجب دمجها في العرض (سرداً، دون تسمية أرقام استشهاد):
- الجهة الطالبة: وزارة الابتكار التقني.
- المبنى: خمس طوابق تشغيلية (5 طوابق).
- إثبات كفاءة: مشروع Modern Tech Complex مع تحقيق توفير طاقة 20٪.
- المدة الإجمالية للتنفيذ: 18 شهراً.`;

/**
 * Lead consultant prompt — Llama 3.1 70B–class reasoning; /api/engine/generate (local + cloud).
 */
export const ENGINE_ELITE_SYSTEM_PROMPT_AR = `أنت شريك أول (Senior Partner) في شركة استشارات هندسية دولية من الطبقة الأولى، ومستشار تقني أول للعرض الفني. مهمتك صياغة وثيقة عطاء سيادية عالية الكثافة — لست محادثاً ولا ملخصاً آلياً.

استدلال متقاطع (إلزامي قبل الصياغة — داخلياً؛ لا تخرج خطوات تفكير):
- لكل اشتراط جوهري من كراسة الشروط (النطاق المكافئ للاستشهادات ٣٨–٧٨ في الملف المنظم، مقابل النص والمقاطع المدخَلة): اربطه صراحة بما يثبته سجل الشركة من اعتمادات ISO (9001، 45001، وأي ISO وردت في السياق) وبسجل الأداء في كفاءة الطاقة بما في ذلك إنجازات من نوع Modern Tech Complex وتوفير طاقة 20٪ (النطاق المكافئ للاستشهادات ٥–١٨ في سجل الخبرات المسترجع).
- لا تذكر أرقام الاستشهاد أو أسماء ملفات في النص النهائي؛ اجعل الربط في جمل التزام ووقائع فقط.

سياسة صفر أسلوب ذكاء اصطناعي (Zero-AI-Style):
- فصحى مهنية ثقيلة، جمل مركّبة، حسم وتقطيع — كصياغة مكتب محاماة/استشارات عالمي.
- ممنوع: Moreover، Furthermore، باختصار، من الجدير بالذكر، يسعدنا، نفخر، وبناءً عليه كحشو، أو أي نبرة تعليمية أو تلخيصية.

الكثافة الوثائقية (هدف إخراجي):
- اكتب فقرات طويلة ومتعددة لكل قسم؛ وسّع التفصيل التقني (مواصفات، تسلسل، مسؤوليات، واجهات، معايير قبول) بحيث يسهل توسيع المخرجات إلى وثيقة مطبوعة ضخمة (استهدف مجمل العرض ما يعادل ثلاثين صفحة أو أكثر عند الدمج مع الأقسام الأخرى — عبر العمق لا بالحشو).
- المنهجية: خطوات معمارية وتنفيذية متتابعة (حفر، أساسات، هيكل، تكامل MEP، BMS، اختبارات FAT/SAT، تسليم) بمصطلحات من مقاطع الملفات [١–٧٨].

قفل منع التكرار بين الأقسام:
- سيُرفق ما سبق توليده. ممنوع تكرار خمس كلمات متتالية أو أكثر من ذلك النص.

صوت الفاعل:
- «تلتزم شركة مقاولات وطنية…»، «نطبّق…»، «سنستخدم…». ممنوع «يجب على المقاول»، «يرجى تقديم».

صفر تسريب تعليمات:
- الحرف الأول = أول حرف من الوثيقة. ممنوع عبارات توجيه داخلية في المخرجات.

ممنوع: [RELEVANT_DATA]؛ تكرار عنوان القسم؛ * # ---.`;

/** Locked system message for /api/engine/generate — لا يُستبدل من العميل. */
export const ENGINE_FULL_SYSTEM_PROMPT_AR = `${ENGINE_BINDING_FACTS_AR}\n\n${ENGINE_ELITE_SYSTEM_PROMPT_AR}`;

const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isGemini503Error(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  const lower = msg.toLowerCase();
  return (
    lower.includes("503") ||
    lower.includes("service unavailable") ||
    lower.includes("unavailable") ||
    lower.includes("overloaded")
  );
}

function buildOpenAiFallback(settings: UserModelSettings): UserModelSettings | null {
  const apiKey = settings.modelApiKey?.trim();
  if (!apiKey) return null;
  return {
    aiProvider: "openai",
    generationEngine: "openai",
    modelApiKey: apiKey,
    geminiApiKey: settings.geminiApiKey,
    embeddingModel: settings.embeddingModel,
    chatModel: "gpt-4o",
  };
}

/** Base URL for Ollama-compatible local API (default port 11434). */
export function getLocalOllamaBaseUrl(): string {
  const fromEnv =
    process.env.LOCAL_OLLAMA_URL?.trim() ||
    process.env.OLLAMA_HOST?.trim() ||
    process.env.LOCAL_AI_BASE_URL?.trim();
  return (fromEnv || "http://127.0.0.1:11434").replace(/\/$/, "");
}

/** Default Ollama image: Llama 3.1 70B lead consultant (override LOCAL_OLLAMA_MODEL). */
export function getLocalOllamaModel(): string {
  return (
    process.env.LOCAL_OLLAMA_MODEL?.trim() ||
    process.env.OLLAMA_MODEL?.trim() ||
    "llama3.1:70b"
  );
}

/** Max tokens per Ollama completion (higher for 70B long-form sections). */
export function getLocalOllamaNumPredict(): number {
  const raw = process.env.LOCAL_OLLAMA_NUM_PREDICT?.trim();
  const n = raw ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 256) return Math.min(Math.floor(n), 32768);
  return 16384;
}

/** Per-request Ollama HTTP timeout (ms) — 70B needs headroom. */
export function getLocalOllamaTimeoutMs(): number {
  const raw = process.env.LOCAL_OLLAMA_TIMEOUT_MS?.trim();
  const n = raw ? Number(raw) : NaN;
  // Enforce a minimum 120s for deep sovereign generation.
  if (Number.isFinite(n) && n >= 120_000) return Math.floor(n);
  return 600_000;
}

async function ollamaChat(
  baseUrl: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/chat`;
  const numPredict = getLocalOllamaNumPredict();
  const timeoutMs = getLocalOllamaTimeoutMs();
  const signal =
    typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(timeoutMs)
      : undefined;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        options: { temperature: 0.28, top_p: 0.92, num_predict: numPredict },
      }),
      signal,
    });
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "AbortError" || name === "TimeoutError") {
      throw new Error(
        `انتهت مهلة المحرك المحلي (${Math.round(timeoutMs / 1000)} ث). زِد LOCAL_OLLAMA_TIMEOUT_MS أو خفّض حجم المدخلات.`,
      );
    }
    throw e;
  }
  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`المحرك المحلي (${res.status}): ${rawText.slice(0, 500)}`);
  }
  let body: { message?: { content?: string }; error?: string };
  try {
    body = JSON.parse(rawText) as { message?: { content?: string }; error?: string };
  } catch {
    throw new Error(`استجابة غير JSON من المحرك المحلي: ${rawText.slice(0, 200)}`);
  }
  if (body.error) throw new Error(body.error);
  const content = body.message?.content;
  if (!content || !String(content).trim()) {
    throw new Error("استجابة فارغة من المحرك المحلي (Ollama).");
  }
  return String(content).trim();
}

/**
 * Routes generation: sovereign → Ollama (Llama 3.1 / LOCAL_OLLAMA_MODEL) at LOCAL_OLLAMA_URL, else cloud.
 * Optional auto-fallback to cloud if local is down (SOVEREIGN_AUTO_CLOUD_FALLBACK !== "false").
 */
export async function completeGeneration(
  settings: UserModelSettings,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (settings.generationEngine === "sovereign") {
    const base = getLocalOllamaBaseUrl();
    const model = getLocalOllamaModel();
    try {
      return await ollamaChat(base, model, systemPrompt, userPrompt);
    } catch (e) {
      const allowCloud = process.env.SOVEREIGN_AUTO_CLOUD_FALLBACK !== "false";
      if (allowCloud) {
        console.error("[ai-gateway] sovereign (Ollama) failed, cloud fallback:", e);
        return completeText(settings, systemPrompt, userPrompt);
      }
      throw e instanceof Error ? e : new Error(String(e));
    }
  }
  if (settings.generationEngine === "gemini") {
    return completeText({ ...settings, aiProvider: "gemini" }, systemPrompt, userPrompt);
  }
  if (settings.generationEngine === "openai") {
    return completeText({ ...settings, aiProvider: "openai" }, systemPrompt, userPrompt);
  }
  return completeText(settings, systemPrompt, userPrompt);
}

/** Retries + Gemini 503 → GPT-4o fallback (cloud path only). */
export async function completeGenerationWithRetry(
  settings: UserModelSettings,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  let lastErr: unknown = null;
  let active: UserModelSettings = settings;
  let usedOpenAiFallback = false;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await completeGeneration(active, systemPrompt, userPrompt);
    } catch (e) {
      lastErr = e;
      const shouldCloud503Fallback =
        active.generationEngine !== "sovereign" &&
        active.aiProvider === "gemini" &&
        !usedOpenAiFallback &&
        isGemini503Error(e);
      if (shouldCloud503Fallback) {
        const fb = buildOpenAiFallback(settings);
        if (fb) {
          usedOpenAiFallback = true;
          active = fb;
          console.error("[ai-gateway] Gemini 503 — OpenAI gpt-4o fallback");
          continue;
        }
      }
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : "فشل توليد المسودة.";
  throw new Error(msg);
}
