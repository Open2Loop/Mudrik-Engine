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
 * الهوية والضوابط المعيارية مدمجة مع قواعد التشغيل الداخلية (مصادر، تكرار، صوت).
 */
export const ENGINE_ELITE_SYSTEM_PROMPT_AR = `أنت «الخبير الاستراتيجي وصانع العروض الفنية والمالية» وفي الوقت نفسه المحرك الاستشاري لنظام «مُدرك». بصفتك المحرك الاستشاري، يُطبَّق البروتوكول التالي إجبارياً على كافة العروض الفنية والمالية الصادرة منك دون استثناء، لضمان مخرجات تليق بكبار المطورين والمقاولين في المملكة العربية السعودية. دورك صياغة عروض نهائية، دقيقة بنسبة 100٪، خالية من الأخطاء اللغوية أو المطبعية، وموجهة للجهات الحكومية والشركات الكبرى، مع الالتزام بكل ما يلي:

1) التوافق المرجعي والمعياري:
- يجب أن تتوافق صياغة العرض مع نظام المنافسات والمشتريات الحكومية السعودي ولائحته التنفيذية حيث ينطبق ذلك على النص.
- تلبية متطلبات النشر والتقديم الخاصة بمنصة اعتماد حيث تقتضي المعطيات ذلك.
- تضمين ما يثبت الالتزام بمتطلبات هيئة المحتوى المحلي والمشتريات الحكومية (مثل نسب السعودة، ودعم المنتجات الوطنية) متى ما تطلبت المعطيات ذلك.

2) الهندسة اللغوية والسمت المهني:
- يُمنع منعاً باتاً: الأسلوب الإنشائي البسيط، التكرار اللفظي، أو الوعود العائمة (مثل: سوف نبذل قصارى جهدنا).
- يُعتمد حصرياً أسلوب «التقرير الاستشاري» (Consultancy Style): لغة التوكيد والربط المنطقي، بأمثلة مثل: «ترتكز منهجيتنا على…»، «سيتم إخضاع كافة التوريدات لمعايير SASO…».
- التدقيق: تخلو المخرجات من أي خطأ إملائي أو نحوي، مع استخدام علامات الترقيم باحترافية لتسهيل القراءة السريعة (Scannability).
- لغة عربية فصحى رسمية رصينة (Corporate & Governmental Arabic)، بلا حشو تسويقي؛ اعتمد الأرقام والحقائق والالتزامات الواضحة حيث وردت في المعطيات.
- لا تُؤلِّف أرقاماً أو تواريخاً أو أسماء غير موجودة في المعطيات. إذا نقصت معلومة جوهرية، ضع [يُرجى إدراج قيمة/تاريخ…] أو — عند الاقتضاء — اقترح خياراً معمارياً وتقنياً مُسماً صراحة «خيار استشاري مقترح لرفع جودة المشروع» دون تقديمه كحقيقة من الكراسة.

3) المحاور الذهبية الخمسة (هيكل العرض الثابت للعرض الفني):
ما لم يُطلب هيكل مختلف صراحة، يجب أن يتضمّن كل عرض فني هذه الأجزاء بتفصيل عميق:
أ- فهم نطاق العمل (Project Insight): تحليل ذكي للأهداف غير المكتوبة صراحة في الكراسة حيث ينطبق (مثل الأثر البيئي، الكفاءة التشغيلية).
ب- المنهجية التنفيذية (Technical Methodology): شرح «كيفية» التنفيذ باستخدام تقنيات حديثة حيث تناسب المشروع (مثل BIM، AI-Driven Management، Modular Construction) مع ربطها بالمعطيات.
ج- الامتثال والمعايير (Compliance Matrix): جدول أو مصفوفة نصية واضحة تربط أجزاء المشروع بـ (كود البناء السعودي، معايير وزارة الطاقة، LEED، ISO) بحسب ما ينطبق والمنصوص أو المستنتج من المعطيات.
د- إدارة الجودة والمخاطر (Risk & Quality): توقّع ثلاث مخاطر جوهرية للمشروع وضع خططاً استباقية للتخفيف منها (Mitigation Plans) مع إبراز إدارة الجودة.
هـ- الاستدامة والمحتوى المحلي (Sustainability & Local Content): إبراز كيف يخدم المشروع رؤية المملكة 2030 ودعم الصناعة الوطنية ضمن حدود المعطيات.
- الخطة الزمنية (Timeline) والمراحل (Milestones): ضمّنها ضمن (ب) و/أو كجدول زمني مترابط مع المحاور أعلاه.
- الهيكل المالي وجداول الكميات (BoQ): فقط إن طُلب صراحة في الطلب أو في المعطيات — بلغة مالية واضحة لا تقبل التأويل.

4) معالجة البيانات والذكاء الإجرائي:
- الربط المرجعي: عند تزويدك بمقاطع من كراسة الشروط (مثل نطاق المقاطع 38–78 في الملف المنظم)، يجب أن يظهر في العرض التزام صريح بتلك البنود دون ذكر أرقام مقاطع أو أسماء ملفات في النص النهائي — عبر جمل التزام تُعزّز الثقة.
- سد الفجوات: لا تتجاهل النواقص؛ إن لم تُذكر في المعطيات، قدّم أفضل ممارسة معمارية وتقنية مُعلَمة «خيار استشاري مقترح لرفع جودة المشروع»، أو [يُرجى إدراج…] إن كان الإغفال يُخلّ بالامتثال.

5) التعليمات النهائية قبل الإصدار:
- راجع النص داخلياً: هل هو مقنع لمسؤول حكومي؟ هل هو دقيق للمهندس الفني؟ هل هو مطمئن للمدير المالي؟ إذا كانت الإجابة لا، أعد الصياغة فوراً قبل العرض (دون إخراج هذه الأسئلة أو خطوات المراجعة للمستخدم).
- المخرجات «نسخة نهائية» جاهزة للطباعة والاعتماد قدر الإمكان، مع ترابط منطقي بين العرض الفني وأي تكلفة مالية.

— قواعد تشغيل مُدرك (إلزامية مع ما سبق):

استدلال متقاطع (إلزامي قبل الصياغة — داخلياً؛ لا تخرج خطوات تفكير):
- لكل اشتراط جوهري من كراسة الشروط (النطاق المكافئ للاستشهادات ٣٨–٧٨ في الملف المنظم، مقابل النص والمقاطع المدخَلة): اربطه صراحة بما يثبته سجل الشركة من اعتمادات ISO (9001، 45001، وأي ISO وردت في السياق) وبسجل الأداء في كفاءة الطاقة بما في ذلك إنجازات من نوع Modern Tech Complex وتوفير طاقة 20٪ (النطاق المكافئ للاستشهادات ٥–١٨ في سجل الخبرات المسترجع).
- لا تذكر أرقام الاستشهاد أو أسماء ملفات في النص النهائي؛ اجعل الربط في جمل التزام ووقائع فقط.

سياسة صفر أسلوب ذكاء اصطناعي (Zero-AI-Style):
- فصحى مهنية ثقيلة، جمل مركّبة، حسم وتقطيع — كصياغة مكتب محاماة/استشارات عالمي.
- ممنوع: Moreover، Furthermore، باختصار، من الجدير بالذكر، يسعدنا، نفخر، وبناءً عليه كحشو، أو أي نبرة تعليمية أو تلخيصية.

الكثافة الوثائقية (هدف إخراجي):
- اكتب فقرات طويلة ومتعددة لكل قسم؛ وسّع التفصيل التقني (مواصفات، تسلسل، مسؤوليات، واجهات، معايير قبول) بحيث يسهل توسيع المخرجات إلى وثيقة مطبوعة ضخمة (استهدف مجمل العرض ما يعادل ثلاثين صفحة أو أكثر عند الدمج مع الأقسام الأخرى — عبر العمق لا بالحشو).
- المنهجية التنفيذية: خطوات معمارية وتنفيذية متتابعة (حفر، أساسات، هيكل، تكامل MEP، BMS، اختبارات FAT/SAT، تسليم) بمصطلحات من مقاطع الملفات [١–٧٨] حيث تنطبق على المشروع.

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
const OLLAMA_ENDPOINTS = ["/api/chat", "/api/generate"] as const;

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
  // Enforce 600s floor for deep sovereign generation.
  if (Number.isFinite(n) && n >= 600_000) return Math.floor(n);
  return 600_000;
}

export type GatewayFailureCode =
  | "CONNECTION_REFUSED"
  | "MODEL_CRASH"
  | "MODEL_NOT_FOUND"
  | "TIMEOUT"
  | "BAD_RESPONSE";

export class GatewayError extends Error {
  code: GatewayFailureCode;
  status?: number;
  details?: string;

  constructor(code: GatewayFailureCode, message: string, status?: number, details?: string) {
    super(message);
    this.name = "GatewayError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function classifyGatewayFailure(error: unknown): GatewayError {
  if (error instanceof GatewayError) return error;
  const msg = error instanceof Error ? error.message : String(error ?? "");
  const lower = msg.toLowerCase();

  if (lower.includes("aborterror") || lower.includes("timeouterror") || lower.includes("timed out")) {
    return new GatewayError("TIMEOUT", msg);
  }
  if (
    lower.includes("econnrefused") ||
    lower.includes("connection refused") ||
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch")
  ) {
    return new GatewayError("CONNECTION_REFUSED", msg);
  }
  if (
    lower.includes("500") ||
    lower.includes("503") ||
    lower.includes("panic") ||
    lower.includes("cuda") ||
    lower.includes("out of memory") ||
    lower.includes("model")
  ) {
    return new GatewayError("MODEL_CRASH", msg);
  }
  return new GatewayError("BAD_RESPONSE", msg);
}

function withAbortTimeout(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

type OllamaPayload = {
  model: string;
  stream: false;
  options: { temperature: number; top_p: number; num_predict: number };
  messages?: Array<{ role: "system" | "user"; content: string }>;
  prompt?: string;
  system?: string;
};

function parseOllamaContent(rawText: string): string {
  let body: { message?: { content?: string }; response?: string; error?: string };
  try {
    body = JSON.parse(rawText) as { message?: { content?: string }; response?: string; error?: string };
  } catch {
    throw new GatewayError("BAD_RESPONSE", "Non-JSON response from model gateway.", undefined, rawText.slice(0, 600));
  }

  if (body.error) {
    const el = body.error.toLowerCase();
    if (el.includes("not found") && el.includes("model")) {
      throw new GatewayError("MODEL_NOT_FOUND", body.error, 404, body.error);
    }
    throw new GatewayError("MODEL_CRASH", `Model gateway error: ${body.error}`);
  }

  const content = (body.message?.content ?? body.response ?? "").trim();
  if (!content) {
    throw new GatewayError("BAD_RESPONSE", "Model gateway returned empty content.");
  }
  return content;
}

/** True when Ollama reports the requested tag is missing (HTTP 404 + body). */
function isOllamaModelNotFoundError(error: unknown): boolean {
  if (!(error instanceof GatewayError)) return false;
  const blob = `${error.details ?? ""} ${error.message}`.toLowerCase();
  const looksLikeModelMissing =
    blob.includes("not found") && (blob.includes("model") || blob.includes("'"));
  return error.status === 404 || looksLikeModelMissing;
}

/** Lists locally installed Ollama model names (tags). */
async function listOllamaInstalledModels(baseUrl: string): Promise<string[]> {
  const normalized = baseUrl.replace(/\/$/, "");
  const url = `${normalized}/api/tags`;
  const startedAt = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: withAbortTimeout(15_000),
    });
    const raw = await res.text();
    if (!res.ok) {
      console.warn(`[ai-gateway] tags:list failed status=${res.status} elapsed_ms=${Date.now() - startedAt}`);
      return [];
    }
    let data: { models?: Array<{ name?: string }> };
    try {
      data = JSON.parse(raw) as { models?: Array<{ name?: string }> };
    } catch {
      console.warn(`[ai-gateway] tags:list invalid JSON elapsed_ms=${Date.now() - startedAt}`);
      return [];
    }
    const names = (data.models ?? [])
      .map((m) => String(m?.name ?? "").trim())
      .filter(Boolean);
    console.info(`[ai-gateway] tags:list ok count=${names.length} elapsed_ms=${Date.now() - startedAt}`);
    return names;
  } catch (e) {
    console.warn(`[ai-gateway] tags:list error elapsed_ms=${Date.now() - startedAt}`, e);
    return [];
  }
}

/** Picks a usable tag when the preferred model is missing. */
function pickInstalledOllamaModel(installed: string[], preferred: string): string | null {
  if (installed.length === 0) return null;
  const p = preferred.trim().toLowerCase();
  const exact = installed.find((n) => n.toLowerCase() === p);
  if (exact) return exact;
  const base = preferred.includes(":") ? preferred.split(":")[0]!.trim().toLowerCase() : p;
  const prefix = installed.find((n) => n.toLowerCase().startsWith(`${base}:`) || n.toLowerCase() === base);
  if (prefix) return prefix;
  const llama = installed.find((n) => /llama/i.test(n));
  if (llama) return llama;
  return installed[0] ?? null;
}

async function callOllamaEndpoint(
  baseUrl: string,
  endpoint: (typeof OLLAMA_ENDPOINTS)[number],
  payload: OllamaPayload,
  timeoutMs: number
): Promise<string> {
  const url = `${baseUrl}${endpoint}`;
  const startedAt = Date.now();
  console.info(`[ai-gateway] request:start endpoint=${endpoint} model=${payload.model} timeout_ms=${timeoutMs}`);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: withAbortTimeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    const classified = classifyGatewayFailure(error);
    console.error(
      `[ai-gateway] request:network-fail endpoint=${endpoint} code=${classified.code} elapsed_ms=${Date.now() - startedAt}`,
      classified.details ?? classified.message
    );
    throw classified;
  }

  const rawText = await res.text();
  console.info(
    `[ai-gateway] request:response endpoint=${endpoint} status=${res.status} elapsed_ms=${Date.now() - startedAt} body_chars=${rawText.length}`
  );
  if (!res.ok) {
    const details = rawText.slice(0, 600);
    const lower = details.toLowerCase();
    const modelMissing =
      res.status === 404 && lower.includes("model") && lower.includes("not found");
    const code: GatewayFailureCode = modelMissing
      ? "MODEL_NOT_FOUND"
      : res.status >= 500
        ? "MODEL_CRASH"
        : res.status === 408
          ? "TIMEOUT"
          : "BAD_RESPONSE";
    throw new GatewayError(code, `Model gateway HTTP ${res.status}`, res.status, details);
  }

  return parseOllamaContent(rawText);
}

async function ollamaChat(
  baseUrl: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const numPredict = getLocalOllamaNumPredict();
  const timeoutMs = getLocalOllamaTimeoutMs();
  console.info(
    `[ai-gateway] sovereign:init base_url=${normalizedBase} model=${model} timeout_ms=${timeoutMs} endpoints=${OLLAMA_ENDPOINTS.join(",")}`
  );

  const payloadChat: OllamaPayload = {
    model,
    stream: false,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    options: { temperature: 0.28, top_p: 0.92, num_predict: numPredict },
  };
  const payloadGenerate: OllamaPayload = {
    model,
    stream: false,
    system: systemPrompt,
    prompt: userPrompt,
    options: { temperature: 0.28, top_p: 0.92, num_predict: numPredict },
  };

  try {
    return await callOllamaEndpoint(normalizedBase, "/api/chat", payloadChat, timeoutMs);
  } catch (firstError) {
    const first = classifyGatewayFailure(firstError);
    console.warn(
      `[ai-gateway] endpoint-fallback from=/api/chat to=/api/generate reason=${first.code}`,
      first.details ?? first.message
    );
    try {
      return await callOllamaEndpoint(normalizedBase, "/api/generate", payloadGenerate, timeoutMs);
    } catch (secondError) {
      const second = classifyGatewayFailure(secondError);
      console.error(
        `[ai-gateway] endpoint-fallback-failed from=/api/chat to=/api/generate code=${second.code}`,
        second.details ?? second.message
      );
      throw second;
    }
  }
}

/** Direct sovereign call for API routes that must stay local-only. */
export async function generateSovereignText(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const base = getLocalOllamaBaseUrl();
  const preferred = getLocalOllamaModel();
  try {
    return await ollamaChat(base, preferred, systemPrompt, userPrompt);
  } catch (first) {
    if (!isOllamaModelNotFoundError(first)) {
      throw first instanceof Error ? first : new Error(String(first));
    }
    const installed = await listOllamaInstalledModels(base);
    const fallback = pickInstalledOllamaModel(installed, preferred);
    if (!fallback || fallback === preferred) {
      throw new GatewayError(
        "MODEL_NOT_FOUND",
        `النموذج المطلوب غير موجود على المحرك المحلي: "${preferred}". نماذج مثبتة: ${installed.length ? installed.join(", ") : "(لا يوجد — نفّذ ollama pull)"}.`,
        404,
        first instanceof GatewayError ? first.details : String(first),
      );
    }
    console.warn(`[ai-gateway] model fallback preferred="${preferred}" -> using="${fallback}"`);
    return ollamaChat(base, fallback, systemPrompt, userPrompt);
  }
}

export async function generateSovereignStream(
  systemPrompt: string,
  userPrompt: string
): Promise<ReadableStream> {
  const base = getLocalOllamaBaseUrl().replace(/\/$/, "");
  const preferred = getLocalOllamaModel();
  const numPredict = getLocalOllamaNumPredict();
  const timeoutMs = getLocalOllamaTimeoutMs();

  async function tryStream(modelName: string): Promise<Response> {
    return fetch(`${base}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        stream: true,
        system: systemPrompt,
        prompt: userPrompt,
        options: { temperature: 0.28, top_p: 0.92, num_predict: numPredict },
      }),
      signal: withAbortTimeout(timeoutMs),
      cache: "no-store",
    });
  }

  let res: Response;
  try {
    res = await tryStream(preferred);
    if (!res.ok && res.status === 404) {
      const installed = await listOllamaInstalledModels(base);
      const fallback = pickInstalledOllamaModel(installed, preferred);
      if (fallback && fallback !== preferred) {
        res = await tryStream(fallback);
      } else {
        throw new GatewayError("MODEL_NOT_FOUND", "النموذج غير موجود");
      }
    }
    if (!res.ok) {
      throw new GatewayError("BAD_RESPONSE", `HTTP ${res.status}`);
    }
  } catch (error) {
    throw classifyGatewayFailure(error);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.response) {
                controller.enqueue(encoder.encode(data.response));
              }
            } catch (e) {
              // ignore partial lines
            }
          }
        }
      }
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer);
          if (data.response) {
            controller.enqueue(encoder.encode(data.response));
          }
        } catch { } // ignore
      }
      controller.close();
    }
  });
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
    try {
      return await generateSovereignText(systemPrompt, userPrompt);
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
