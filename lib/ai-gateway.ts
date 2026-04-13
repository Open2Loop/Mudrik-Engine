/**
 * @project MUDRIK - AI Tender Consultant
 * MUDRIK_CORE_OS: تحليل (DeepSeek-R1-class) + صياغة عربية كثيفة (Llama/Qwen-class) عبر Ollama؛ السحابة عند الحاجة.
 */

import type { UserModelSettings } from "@/lib/model-gateway";
import { completeText } from "@/lib/model-gateway";

/**
 * Binding tender facts — woven into narrative; no [cite] in final output (stripped server-side).
 * قفل المصادر: الوثيقتان المعتمدتان فقط هما كراسة الشروط المستخرجة وسجل الخبرات المسترجع في الطلب.
 */
export const ENGINE_BINDING_FACTS_AR = `قفل المصادر (لا تستند إلى معلومات خارج ما يلي):
- نص كراسة الشروط كما يُمرَّر في طلب التوليد (إن وُجد).
- مقاطع سجل الخبرات أو الوثائق الداعمة المسترجعة في الطلب (إن وُجدت).
- الحقول الصريحة في سياق الطلب: اسم المشروع، الجهة المالكة أو الطالبة، مدة التنفيذ.

يُمنع اختلاق أو تثبيت وقائع مشروع ثابتة (جهة، طوابق، مدة، معايير أداء، أسماء مشاريع مرجعية) ما لم ترد صراحة في الكراسة أو السياق أعلاه. ادُمِج المتطلبات كعهود حاكمة دون ذكر أرقام مقاطع في المخرجات.`;

/**
 * بروتوكول نواة مُدرك — الإصدار 7.0 (MUDRIK_CORE_OS: Hybrid + Shadow Workflow).
 * يُدمج مع قفل المصادر في ENGINE_FULL_SYSTEM_PROMPT_AR؛ المسار الهرمي للمجلد 1 يستخدم نموذج تحليل ثم صياغة (انظر sovereign-volume1-recursive).
 */
export const ENGINE_ELITE_SYSTEM_PROMPT_AR = `معرّف البروتوكول: MUDRIK_CORE_OS_v7.0 — إلزامي

0) بنية النظام (Hybrid Open-Source — منطق داخلي):
يُفترض فصل الأدوار على المحرك المحلي عند توفر وسوم متعددة: المنطق الأساسي (التحليل/الامتثال لـ SBC والأكواد) يُناسب نماذج مثل DeepSeek-R1 (بما في ذلك إصدارات كاملة/كبيرة عند توفرها)؛ الصياغة الاحترافية العربية عالية الكثافة تُناسب أقوى النماذج مفتوحة الأوزان المتاحة (مثل فئة Llama 3.1 أو Qwen 2.5 حسب الوسم المثبت). عند استدعاء واحد فقط، نفّذ كلا الدورين داخلياً دون إخراج وسيط.

1) مسار الظل (Shadow Process — دفعات داخلية لا تُعرض):
الدفعة 1 — التحليل الإنشائي: استخراج كل متطلب تقني، وكل إسناد إلى SBC، وكل ما يلزم لمحتوى محلي LCGPA؛ لا تُكمل الصياغة النهائية قبل اكتمال هذه الخريطة ذهنياً.
الدفعة 2 — التوسيع المحتوي: توليد كل قسم بزيادات لا تقل عن 1500+ كلمة؛ لا تنتقل إلى القسم التالي قبل استيفاء القسم تقنياً (Technical Exhaustiveness).
الدفعة 3 — وكيل التنقيح (Auditor مخفي): يمسح النص؛ أي فقرة تشبه صياغة آلية عامة، أو تكرر عناوين/عبارات، تُستبعد وتُعاد بصياغة تنفيذية سيادية (Sovereign Executive Prose) داخلياً.

2) المعايير اللغوية والتقنية:
اللغة: فصحى رصينة بمستوى استشاري من الطبقة الأولى. المخرج المقدَّم للجهة الحكومية نص عربي بالكامل في الجمل والفقرات التأسيسية؛ الإنجليزية مسموحة فقط للمصطلح التخصصي بين قوسين مباشرة بعد الصياغة العربية (مثل: نظام إدارة المرافق (IWMS))، دون فقرات أو أقسام كاملة بالإنجليزية.
حظر ثنائية العناوين المضلِّلة: لا تكرر عنوان المجلد بصيغة إنجليزية منفصلة ثم تعيد المحتوى؛ لا تفتح مقاطع بقوالب مثل «1. Executive Summary» أو «This document provides…».
صفر آثار آلية: حظر عبارات تلخيص عامة أو تنويه فارغ (مثل In summary، It is worth noting، «في الخلاصة»، «من الجدير بالذكر»، وما شابه). ابدأ المقاطع مباشرة بتصريحات استراتيجية أو تقنية.
حظر قوالب الوثائق الإنجليزية الشائعة في مخرجات النماذج: This document provides؛ comprehensive overview؛ stakeholders؛ essential guide؛ ambitious endeavor؛ landmark achievement؛ serves as؛ throughout all stages.
حظر الحشو العربي الفارغ: لا تكرر نفس الجملة أو المقولة النمطية في أكثر من فقرة (مثل إعادة صياغة «تُساهم هذه الأعمال في… بيئة عمل فعالة» دون أرقام أو التزامات أو تفاصيل تقنية جديدة في كل مرة).
معيار الدقة في كل فقرة: يجب أن تضيف فقرة صالحة واحداً على الأقل مما يلي ولم يُسبق ذكره بنفس المعنى: التزام تعاقدي قابل للتحقق؛ حد كمّي أو مؤشر أداء؛ مرجع تنظيمي سعودي دقيق؛ تفصيل هندسي أو بروتوكولي؛ أو بعد تمويلي/تكلفة/جدولة مرتبط بالعرض.
الدقة التنظيمية: SASO هي الهيئة السعودية للمواصفات والمقاييس والجودة — لا تُسِمَّ جهة بيئية أجنبية أو تخلط الأدوار ما لم ينصّ عليه نص الكراسة صراحة. ISO 45001 يخص إدارة الصحة والسلامة المهنية وليس بديلاً عن اشتراطات أنظمة الإطفاء والإنذار في SBC/SASO عند انطباقها.
قاعدة الصفحات الثلاثين: وسّع عبر «التفكيك التقني» — لا تذكر نظاماً باسمه فقط؛ فصّل البنية، والبروتوكولات، والتوصيل، وSLA الصيانة حيث ينطبق.
الامتثال: ادمج إسناداً صريحاً أو ضمنياً إلى SBC 201 وSBC 801 وSASO ورؤية المملكة 2030 ومنصة اعتماد (Etimad) في نسيج النص لا كذكر سطحي.

3) التعقيم والمخرجات (Clean Text Only):
حظر Markdown بالكامل (* # ** …). الترقيم الهرمي النظيف فقط: 1.0، 1.1، 1.1.1، 1.1.1.1 عند الحاجة.
النص جاهز للطباعة والتقديم الحكومي بمستوى قانوني/فني رصين.

4) معاملات التنفيذ (مرجعية — يطبّقها الخادم على Ollama):
وضع الدقة: Temperature ≈ 0.1؛ عقوبة التردد Frequency Penalty ≈ 1.0 (صفر تكرار مكروبن)؛ عقوبة الحضور Presence Penalty ≈ 0.8 (استمرار ابتكار تفاصيل جديدة).

5) أرضية الإخفاق:
أي مجلد رئيس لا يبلغ 3000 كلمة من النص الفني الصِرف العربي الكثيف يُعدّ مخالفاً للبروتوكول — وسّع المنهجية حتى البلوغ أو أعد الصياغة داخلياً. إن خالف المخرج اللغة العربية للنص الأساسي أو انزلق إلى قالب إنجليزي عام، فالمخالفة أشد من نقص العدد.

6) سلسلة التفكير — داخلي فقط:
لا تُخرج الموجهات ولا مسار الظل؛ المخرج النهائي المصقول فقط.`;

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

/**
 * نموذج التحليل/الامتثال (SBC، متطلبات تقنية) — يُفضّل DeepSeek-R1-class عند التثبيت.
 * إذا وُجد LOCAL_OLLAMA_MODEL فقط، يُستخدم لكل المسارات (وضع نموذج واحد).
 */
export function getSovereignAnalysisModel(): string {
  const split = process.env.LOCAL_OLLAMA_MODEL_ANALYSIS?.trim();
  if (split) return split;
  const legacy = process.env.LOCAL_OLLAMA_MODEL?.trim() || process.env.OLLAMA_MODEL?.trim();
  if (legacy) return legacy;
  return "deepseek-r1:latest";
}

/**
 * نموذج الصياغة العربية عالية الكثافة — يُفضّل Llama 3.1 / Qwen 2.5-class عند التثبيت.
 */
export function getSovereignSynthesisModel(): string {
  const split = process.env.LOCAL_OLLAMA_MODEL_SYNTHESIS?.trim();
  if (split) return split;
  const legacy = process.env.LOCAL_OLLAMA_MODEL?.trim() || process.env.OLLAMA_MODEL?.trim();
  if (legacy) return legacy;
  return "llama3.1:70b";
}

/** Alias: المسودات والبث تستخدم نموذج الصياغة الافتراضي. */
export function getLocalOllamaModel(): string {
  return getSovereignSynthesisModel();
}

/** Max tokens per Ollama completion — default raised for sovereign CoT-expanded long-form (30+ page equivalent across volumes). */
export function getLocalOllamaNumPredict(): number {
  const raw = process.env.LOCAL_OLLAMA_NUM_PREDICT?.trim();
  const n = raw ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 256) return Math.min(Math.floor(n), 32768);
  return 24576;
}

function parseSovereignFloatEnv(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

/**
 * «الأعصاب التقنية» لمحرك العروض السيادية — مضبوطة لدقة قانونية/هندسية عالية وتقليل الهذيان والتكرار.
 * يمكن تجاوزها عبر متغيرات البيئة: SOVEREIGN_OLLAMA_TEMPERATURE، SOVEREIGN_OLLAMA_TOP_P،
 * SOVEREIGN_OLLAMA_FREQUENCY_PENALTY، SOVEREIGN_OLLAMA_PRESENCE_PENALTY، SOVEREIGN_OLLAMA_TOP_K، SOVEREIGN_OLLAMA_REPEAT_PENALTY.
 */
export function getSovereignOllamaGenOptions(): {
  temperature: number;
  top_p: number;
  top_k: number;
  repeat_penalty: number;
  frequency_penalty: number;
  presence_penalty: number;
  num_predict: number;
} {
  return {
    temperature: parseSovereignFloatEnv("SOVEREIGN_OLLAMA_TEMPERATURE", 0.1),
    top_p: parseSovereignFloatEnv("SOVEREIGN_OLLAMA_TOP_P", 0.85),
    top_k: Math.max(1, Math.floor(parseSovereignFloatEnv("SOVEREIGN_OLLAMA_TOP_K", 30))),
    repeat_penalty: parseSovereignFloatEnv("SOVEREIGN_OLLAMA_REPEAT_PENALTY", 1.05),
    frequency_penalty: parseSovereignFloatEnv("SOVEREIGN_OLLAMA_FREQUENCY_PENALTY", 1.0),
    presence_penalty: parseSovereignFloatEnv("SOVEREIGN_OLLAMA_PRESENCE_PENALTY", 0.8),
    num_predict: getLocalOllamaNumPredict(),
  };
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
  const looksLikeModelRuntimeFailure =
    /(load|run|pull|unload|runner|gguf|kv\s*cache|vram|gpu).*model|\bmodel\b.*(load|crash|fail|error|runner)/i.test(
      msg,
    );
  if (
    lower.includes("500") ||
    lower.includes("503") ||
    lower.includes("panic") ||
    lower.includes("cuda") ||
    lower.includes("out of memory") ||
    looksLikeModelRuntimeFailure
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
  options: {
    temperature: number;
    top_p: number;
    num_predict: number;
    top_k?: number;
    repeat_penalty?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  };
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

/** Cache لتقليل /api/tags عند توليد عدة مجلدات (نفس العملية). */
const INSTALLED_TAGS_TTL_MS = 60_000;
let installedTagsCache: { baseUrl: string; names: string[]; at: number } | null = null;

async function getCachedOllamaInstalledModels(baseUrl: string): Promise<string[]> {
  const normalized = baseUrl.replace(/\/$/, "");
  const now = Date.now();
  if (
    installedTagsCache &&
    installedTagsCache.baseUrl === normalized &&
    now - installedTagsCache.at < INSTALLED_TAGS_TTL_MS
  ) {
    return installedTagsCache.names;
  }
  const names = await listOllamaInstalledModels(normalized);
  installedTagsCache = { baseUrl: normalized, names, at: now };
  return names;
}

/**
 * يحوّل الوسم المطلوب إلى وسم مثبت فعلياً قبل أي طلب توليد — يتجنّب فشل /api/chat و/api/generate المتتالي بـ 404
 * (أدلة الطرفية: llama3.1:70b غير مثبت ثم تكرار نفس المحاولة لكل مجلد).
 */
async function resolveOllamaModelTag(preferred: string): Promise<string> {
  const p = preferred.trim();
  if (!p) return p;
  const base = getLocalOllamaBaseUrl();
  const installed = await getCachedOllamaInstalledModels(base);
  const exact = installed.find((n) => n.toLowerCase() === p.toLowerCase());
  if (exact) return exact;
  const fallback = pickInstalledOllamaModel(installed, p);
  if (fallback) return fallback;
  return p;
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

/** يستخرج رقم الحجم بالمليارات من وسم النموذج (مثل 70 من 70b) لترجيح الأكبر. */
function ollamaTagBillionsScore(name: string): number {
  const m = name.match(/(\d+)\s*b\b/i);
  return m ? parseInt(m[1]!, 10) : 0;
}

/** Picks a usable tag when the preferred model is missing (يفضّل deepseek-r1 الأكبر ثم أي مطابقة). */
function pickInstalledOllamaModel(installed: string[], preferred: string): string | null {
  if (installed.length === 0) return null;
  const p = preferred.trim().toLowerCase();
  const exact = installed.find((n) => n.toLowerCase() === p);
  if (exact) return exact;
  const base = preferred.includes(":") ? preferred.split(":")[0]!.trim().toLowerCase() : p;
  const prefixMatches = installed.filter(
    (n) => n.toLowerCase().startsWith(`${base}:`) || n.toLowerCase() === base,
  );
  if (prefixMatches.length > 0) {
    if (/deepseek-r1/i.test(base)) {
      return [...prefixMatches].sort((a, b) => ollamaTagBillionsScore(b) - ollamaTagBillionsScore(a))[0]!;
    }
    return prefixMatches[0]!;
  }
  const deepseekR1 = installed.filter((n) => /deepseek-r1/i.test(n));
  if (deepseekR1.length > 0) {
    return [...deepseekR1].sort((a, b) => ollamaTagBillionsScore(b) - ollamaTagBillionsScore(a))[0]!;
  }
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
  const genOpts = getSovereignOllamaGenOptions();
  const timeoutMs = getLocalOllamaTimeoutMs();
  console.info(
    `[ai-gateway] sovereign:init base_url=${normalizedBase} model=${model} timeout_ms=${timeoutMs} num_predict=${genOpts.num_predict} endpoints=${OLLAMA_ENDPOINTS.join(",")}`
  );

  const payloadChat: OllamaPayload = {
    model,
    stream: false,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    options: genOpts,
  };
  const payloadGenerate: OllamaPayload = {
    model,
    stream: false,
    system: systemPrompt,
    prompt: userPrompt,
    options: genOpts,
  };

  try {
    return await callOllamaEndpoint(normalizedBase, "/api/chat", payloadChat, timeoutMs);
  } catch (firstError) {
    const first = firstError instanceof GatewayError ? firstError : classifyGatewayFailure(firstError);
    if (first.code === "MODEL_NOT_FOUND") {
      throw first;
    }
    console.warn(
      `[ai-gateway] endpoint-fallback from=/api/chat to=/api/generate reason=${first.code}`,
      first.details ?? first.message
    );
    try {
      return await callOllamaEndpoint(normalizedBase, "/api/generate", payloadGenerate, timeoutMs);
    } catch (secondError) {
      const second = secondError instanceof GatewayError ? secondError : classifyGatewayFailure(secondError);
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
  userPrompt: string,
  preferredModel?: string,
): Promise<string> {
  const base = getLocalOllamaBaseUrl();
  const preferred = (preferredModel?.trim() || getSovereignSynthesisModel()).trim();
  const resolved = await resolveOllamaModelTag(preferred);
  if (resolved !== preferred) {
    console.warn(`[ai-gateway] model pre-resolve "${preferred}" -> "${resolved}"`);
  }
  try {
    return await ollamaChat(base, resolved, systemPrompt, userPrompt);
  } catch (first) {
    if (!isOllamaModelNotFoundError(first)) {
      throw first instanceof Error ? first : new Error(String(first));
    }
    installedTagsCache = null;
    const installed = await listOllamaInstalledModels(base);
    const fallback = pickInstalledOllamaModel(installed, preferred);
    if (!fallback || fallback === resolved) {
      throw new GatewayError(
        "MODEL_NOT_FOUND",
        `النموذج المطلوب غير موجود على المحرك المحلي: "${preferred}". نماذج مثبتة: ${installed.length ? installed.join(", ") : "(لا يوجد — نفّذ ollama pull)"}.`,
        404,
        first instanceof GatewayError ? first.details : String(first),
      );
    }
    console.warn(`[ai-gateway] model fallback after failed resolved="${resolved}" -> "${fallback}"`);
    return ollamaChat(base, fallback, systemPrompt, userPrompt);
  }
}

export async function generateSovereignStream(
  systemPrompt: string,
  userPrompt: string
): Promise<ReadableStream> {
  const base = getLocalOllamaBaseUrl().replace(/\/$/, "");
  const preferred = getLocalOllamaModel();
  const resolved = await resolveOllamaModelTag(preferred);
  if (resolved !== preferred) {
    console.warn(`[ai-gateway] stream model pre-resolve "${preferred}" -> "${resolved}"`);
  }
  const genOpts = getSovereignOllamaGenOptions();
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
        options: genOpts,
      }),
      signal: withAbortTimeout(timeoutMs),
      cache: "no-store",
    });
  }

  let res: Response;
  try {
    res = await tryStream(resolved);
    if (!res.ok && res.status === 404) {
      installedTagsCache = null;
      const installed = await listOllamaInstalledModels(base);
      const alt = pickInstalledOllamaModel(installed, preferred);
      if (alt && alt !== resolved) {
        res = await tryStream(alt);
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
 * Routes generation: sovereign → Ollama (صياغة: LOCAL_OLLAMA_MODEL_SYNTHESIS / الافتراضي) at LOCAL_OLLAMA_URL, else cloud.
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
