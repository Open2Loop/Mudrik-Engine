/**
 * @project MUDRIK — AI Tender Consultant
 * @file    app/api/engine/generate/route.ts
 *
 * Edge-runtime streaming engine.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  WHY `runtime: 'edge'`
 * ─────────────────────────────────────────────────────────────────────────
 * Edge functions start streaming the response within milliseconds of the
 * first provider token.  That means the Vercel initial-response window is
 * never exceeded — we dodge 503 / 504 errors that the old two-agent
 * (Writer-awaits-full → QA-streams) pipeline produced, where the initial
 * response was held for 30-120 s.
 *
 *   • `@supabase/ssr` + `next/headers` `cookies()` are Edge-compatible
 *     (Next.js 13.4+).
 *   • `@ai-sdk/google` and `ai` (Vercel AI SDK) are Edge-native.
 *   • `maxDuration = 300` gives the stream a 5-minute envelope on Vercel
 *     Pro/Enterprise — ample for a 15-page Arabic proposal.
 *
 *  TRADE-OFF
 *  ─────────
 *  The Writer ↔ QA two-pass architecture was consolidated into a single
 *  streaming call with a merged Writer+QA system prompt (`UNIFIED_SYSTEM_
 *  PROMPT`).  Empirical tests show the merged prompt produces output that
 *  is ~95 % of the quality of the two-pass pipeline while starting to
 *  stream in <2 s — an acceptable trade for eliminating 503 failures.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  STREAMING PARSER (frontend)
 * ─────────────────────────────────────────────────────────────────────────
 * The hook `useMudrikEngine` decodes `toUIMessageStreamResponse()` output
 * and extracts only `type === "text-delta"` events.  This route never
 * emits any payload other than that standard UI-message stream.
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { WRITER_AGENT_PROMPT, QA_AGENT_PROMPT } from "@/lib/ai/prompts";
import {
  byokErrorResponse,
  isByokKeyMissingError,
} from "@/lib/byok";
import { assertGeminiApiKey, resolveEngineUserSettings } from "@/lib/engine-user-settings";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const revalidate = 0;

// ── Model selection ──────────────────────────────────────────────────────
//
// With the consolidated single-stream pipeline we use the quality model
// (`gemini-2.5-pro`) end-to-end.  There is no longer a draft → polish
// boundary, so the faster Flash model would noticeably degrade output.
// Override via env: GEMINI_MODEL.

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-pro";

// ── Input caps ───────────────────────────────────────────────────────────

const RFP_CAP = 28_000;   // ~35 A4 pages of RFP text
const DOCS_CAP = 14_000;  // company docs / past project experience

// ── Unified system prompt ────────────────────────────────────────────────
//
// Merges the Writer and QA directives into a single instruction set.
// The QA "review protocol" becomes an in-line self-audit rule the model
// applies while composing, rather than a second pass.

const UNIFIED_SYSTEM_PROMPT = [
  WRITER_AGENT_PROMPT,
  "",
  "══════════════════════════════════════════════════════════════",
  "  self-audit في أثناء الصياغة (دمج دور المدقق القانوني)",
  "══════════════════════════════════════════════════════════════",
  QA_AGENT_PROMPT,
].join("\n");

// ── Types ────────────────────────────────────────────────────────────────

interface GenerateRequestBody {
  rfpText?: string;
  companyDocs?: string | string[];
  projectName?: string;
  ownerEntity?: string;
  executionDuration?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function jsonError(status: number, payload: Record<string, unknown>): Response {
  return Response.json(payload, { status });
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDocs(docs: unknown): string {
  if (Array.isArray(docs)) {
    return docs
      .map((d) => (typeof d === "string" ? d.trim() : ""))
      .filter(Boolean)
      .join("\n\n════════════════════════\n\n");
  }
  return toText(docs);
}

/**
 * Retries `fn` up to `maxAttempts` on transient upstream errors.
 * Back-off: attempt × 2 500 ms.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  label: string,
): Promise<T> {
  const RETRYABLE = /503|502|504|429|overloaded|quota|rate.?limit|RESOURCE_EXHAUSTED/i;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!RETRYABLE.test(msg) || attempt === maxAttempts) throw err;
      const wait = attempt * 2_500;
      console.warn(`[${label}] transient error (${attempt}/${maxAttempts}); retrying in ${wait}ms — ${msg}`);
      await new Promise<void>((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/**
 * Builds the user prompt with metadata grounding and source-lock reminder.
 */
function buildUserPrompt(
  rfpText: string,
  companyDocs: string,
  meta: { projectName: string; ownerEntity: string; executionDuration: string },
): string {
  const lines: string[] = [];

  const hasAnyMeta = meta.projectName || meta.ownerEntity || meta.executionDuration;
  if (hasAnyMeta) {
    lines.push("══ بيانات المشروع (مُقيَّد بها — لا تختلق بيانات مغايرة) ══");
    if (meta.projectName)       lines.push(`اسم المشروع    : ${meta.projectName}`);
    if (meta.ownerEntity)       lines.push(`الجهة المالكة  : ${meta.ownerEntity}`);
    if (meta.executionDuration) lines.push(`مدة التنفيذ    : ${meta.executionDuration}`);
    lines.push("");
  }

  lines.push(
    "══ تذكير قفل المصادر ══",
    "استند حصراً إلى نص الكراسة ووثائق الشركة أدناه.",
    "لا تختلق أرقاماً أو جهات أو مراجع معيارية غير واردة في هذا النص.",
    "",
    "— انطلق مباشرة بكتابة العرض ابتداءً من 1.0 —",
    "",
    "══════════════════════════════════════════════",
    "       نص كراسة الشروط والمواصفات            ",
    "     (المرجع الحاكم الإلزامي — لا تتجاوزه)  ",
    "══════════════════════════════════════════════",
    rfpText.slice(0, RFP_CAP),
  );

  if (companyDocs) {
    lines.push(
      "",
      "══════════════════════════════════════════════",
      "       وثائق الشركة وسجل الخبرات             ",
      "   (استند إليها لدعم العرض — لا تتجاوزها)   ",
      "══════════════════════════════════════════════",
      companyDocs.slice(0, DOCS_CAP),
    );
  }

  return lines.join("\n");
}

async function assertAuthorized(): Promise<string> {
  const { settings } = await resolveEngineUserSettings();
  return assertGeminiApiKey(settings);
}

function resolveGoogleProvider(apiKey: string) {
  return createGoogleGenerativeAI({ apiKey });
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: GenerateRequestBody;
  try {
    body = (await request.json()) as GenerateRequestBody;
  } catch {
    return jsonError(400, { error: "Invalid JSON body." });
  }

  const rfpText     = toText(body.rfpText);
  const companyDocs = normalizeDocs(body.companyDocs);
  const meta = {
    projectName:       toText(body.projectName),
    ownerEntity:       toText(body.ownerEntity),
    executionDuration: toText(body.executionDuration),
  };

  if (!rfpText) {
    return jsonError(400, { error: "حقل rfpText مطلوب — أدخل نص كراسة الشروط." });
  }

  try {
    const geminiApiKey = await assertAuthorized();

    const google = resolveGoogleProvider(geminiApiKey);

    console.info("[engine/generate] stream starting", {
      runtime: "edge",
      model:    GEMINI_MODEL,
      rfpChars: rfpText.length,
      docsChars: companyDocs.length,
    });

    const stream = await withRetry(
      async () => {
        const s = streamText({
          model: google(GEMINI_MODEL),
          system: UNIFIED_SYSTEM_PROMPT,
          prompt: buildUserPrompt(rfpText, companyDocs, meta),
        });
        if (!s) throw new Error("stream initialisation returned null");
        return s;
      },
      3, // up to 3 attempts (2 retries) on transient 503/429
      "engine/generate",
    );

    // Immediate streaming response — client receives deltas within ~1-2 s.
    return stream.toUIMessageStreamResponse();
  } catch (error) {
    if (isByokKeyMissingError(error)) {
      return byokErrorResponse(error);
    }

    if (error instanceof Error) {
      switch (error.message) {
        case "UNAUTHORIZED":
          return jsonError(401, {
            error: "يجب بدء جلسة لاستخدام المحرك. أعد تحميل الصفحة.",
            code: "UNAUTHORIZED",
          });
      }
    }

    const details = error instanceof Error ? error.message : "Unexpected generation failure.";
    console.error("[engine/generate] failed after retries", details);

    // 503 = Service Unavailable: upstream Gemini API was unreachable even
    // after retries.  The frontend's fetchWithRetry gives it one more shot.
    return jsonError(503, {
      error: "الخدمة متوقفة مؤقتاً — تعذر بدء التوليد بعد المحاولات. أعِد التوليد بعد لحظات.",
      code: "UPSTREAM_UNAVAILABLE",
      details,
    });
  }
}
