import {
  ENGINE_FULL_SYSTEM_PROMPT_AR,
  completeGenerationWithRetry,
} from "@/lib/ai-gateway";
import { sanitizeSovereignProposalOutput } from "@/lib/proposal-output-sanitize";
import { TECHNICAL_VOLUMES } from "@/lib/technical-volumes";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchUserModelSettings } from "@/lib/user-settings";
import type { UserModelSettings } from "@/lib/model-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;
export const revalidate = 0;
const RETRY_DELAY_MS = 700;
const RFP_CAP = 24_000;
const NON_RETRYABLE_GENERATION_ERROR_RE =
  /GenerateRequestsPerDay|PerDayPerProjectPerModel|quota exceeded|RESOURCE_EXHAUSTED|حصة Gemini اليومية|لا يملك صلاحية الوصول إلى النموذج/i;

const VOLUME_SEPARATOR = "\n\n————————————————————————————\n\n";

function isNonRetryableGenerationError(message: string): boolean {
  return NON_RETRYABLE_GENERATION_ERROR_RE.test(message);
}

function buildBaseContext(
  projectName: string,
  ownerEntity: string,
  executionDuration: string,
  rfpText?: string,
): string {
  const lines = [
    "سياق المشروع (ثابت لجميع المجلدات):",
    `اسم المشروع: ${projectName}`,
    `الجهة المالكة: ${ownerEntity}`,
    `مدة التنفيذ: ${executionDuration}`,
  ];
  const rfp = typeof rfpText === "string" ? rfpText.trim() : "";
  if (rfp) {
    lines.push("", "نص كراسة الشروط المستخرج (نصوص حاكمة — اربط كل مجلد بها):", rfp.slice(0, RFP_CAP));
  }
  return lines.join("\n");
}

function buildVolumeUserPrompt(baseContext: string, volumeIndexZeroBased: number, totalVolumes: number): string {
  const vol = TECHNICAL_VOLUMES[volumeIndexZeroBased];
  if (!vol) throw new Error("Invalid volume index");
  const densityLine =
    "الكثافة — MUDRIK_V8: لا يقل عن 3000 كلمة لهذا المجلد بالعربية؛ إن دون ذلك يُعدّ المخرج مخالفاً للبروتوكول — وسّع المنهجية. لكل نقطة: قصد استراتيجي ← تفكيك تقني (بنية، بروتوكولات، توصيل، صيانة) ← امتثال (SBC 201/801/401 وSASO وLCGPA واعتماد ورؤية 2030) ← تخفيف مخاطر؛ وأضف بعداً مالياً/تعاقدياً حيث ينطبق دون اختلاق أرقام. نحو ~30 صفحة تراكمياً.";
  return [
    baseContext,
    "",
    `المجلد الفني ${vol.index} من ${totalVolumes}`,
    `عنوان المجلد: ${vol.titleAr}`,
    "",
    "تعليمات هذا المجلد:",
    vol.focusAr,
    "",
    "معيار اللغة: النص كاملاً للجهة بالعربية الفصحى الاستشارية؛ الإنجليزية للمصطلح التخصصي بين قوسين فقط. ممنوع فقرات أو أقسام كاملة بالإنجليزية؛ ممنوع قوالب This document provides أو عناوين مزدوجة عربي/إنجليزي لنفس المستوى.",
    "MUDRIK_V8 (توسيع عميق): تجنّب تكرار العناوين والعبارات الآلية والجمل الفارغة؛ ابدأ المقاطع بتصريحات مباشرة. لكل متطلب تقني ركّز على: القصد الاستراتيجي، التفصيل الهندسي، الامتثال (SBC 201 وSBC 801 وSASO وLCGPA واعتماد ورؤية 2030)، التخفيف من المخاطر.",
    "سلسلة التفكير والتوسيع (CoT) — داخلية فقط: قبل الكتابة، خطّط ذهنياً لتفكيك هذا المجلد إلى محاور ثم توسيع كل محور؛ لا تُدرج الخطة أو خطوات التفكير في المخرجات.",
    "أخرج نصاً عربياً نظيفاً فقط لهذا المجلد (لا تولّد المجلدات الأخرى). التنظيم: Technical Compliance Structure — لكل محور المتطلب ثم الحل التقني ثم المرجع؛ ترقيم 1.0 / 1.1 / 1.1.1؛ خطوات داخل الفقرة بـ (أ، ب، ج) أو (1، 2، 3)؛ جداول نصية للمقارنات؛ لغة تعاقدية (تلتزم الجهة المنفذة، يتم التنفيذ وفقاً، تخضع الأعمال). غلق مزدوج ** فقط لمراجع المعايير (**SBC 201**، **NFPA**، إلخ). ممنوع # للعناوين وممنوع شرطات كقوائم.",
    densityLine,
    "حقّن SBC وSASO وLCGPA ورؤية 2030 ومنصة اعتماد؛ اجعل مقاطع الكراسة أعلاه عهوداً حاكمة في النص.",
  ].join("\n");
}

async function generateOneVolume(
  settings: Awaited<ReturnType<typeof fetchUserModelSettings>>,
  userPrompt: string,
): Promise<string> {
  try {
    return await completeGenerationWithRetry(settings, ENGINE_FULL_SYSTEM_PROMPT_AR, userPrompt);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    if (isNonRetryableGenerationError(message)) throw error;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return completeGenerationWithRetry(settings, ENGINE_FULL_SYSTEM_PROMPT_AR, userPrompt);
  }
}

function jsonError(
  status: number,
  payload: Record<string, unknown>,
): Response {
  return Response.json(payload, { status });
}

export async function POST(request: Request) {
  let body: {
    projectName?: string;
    ownerEntity?: string;
    executionDuration?: string;
    rfpText?: string;
    resumeFromSection?: number;
    previousSections?: string[];
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const projectName =
    typeof body.projectName === "string" && body.projectName.trim() !== "" ? body.projectName.trim() : "غير محدد";
  const ownerEntity =
    typeof body.ownerEntity === "string" && body.ownerEntity.trim() !== "" ? body.ownerEntity.trim() : "غير محدد";
  const executionDuration =
    typeof body.executionDuration === "string" && body.executionDuration.trim() !== ""
      ? body.executionDuration.trim()
      : "غير محدد";
  const rfpText = typeof body.rfpText === "string" ? body.rfpText.trim() : "";

  const totalV = TECHNICAL_VOLUMES.length;
  let startIdx = 0;
  if (typeof body.resumeFromSection === "number" && Number.isFinite(body.resumeFromSection)) {
    startIdx = Math.max(0, Math.min(Math.floor(body.resumeFromSection), totalV - 1));
  }

  const previousRaw = Array.isArray(body.previousSections) ? body.previousSections.map((s) => String(s ?? "")) : [];
  const sections: (string | undefined)[] = new Array(totalV);
  for (let j = 0; j < startIdx; j++) {
    sections[j] = sanitizeSovereignProposalOutput(previousRaw[j] ?? "");
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: authData } = await supabase.auth.getUser();
    const requireAuth =
      process.env.NODE_ENV === "production" || process.env.ENGINE_GENERATE_REQUIRE_AUTH === "true";

    if (requireAuth && !authData?.user) {
      return jsonError(401, {
        error: "يجب تسجيل الدخول لتوليد العرض الفني.",
        code: "UNAUTHORIZED",
      });
    }

    const baseContext = buildBaseContext(projectName, ownerEntity, executionDuration, rfpText);
    const settings: UserModelSettings = authData?.user?.id
      ? await fetchUserModelSettings(supabase, authData.user.id)
      : {
          aiProvider: "gemini",
          generationEngine: "gemini",
          modelApiKey: process.env.OPENAI_API_KEY ?? null,
          geminiApiKey: process.env.GEMINI_API_KEY ?? null,
          embeddingModel: "text-embedding-3-small",
          chatModel: "gpt-4o-mini",
        };

    let protocolHeader = "mudrik-v8-cloud";

    for (let vi = startIdx; vi < totalV; vi++) {
      try {
        const userPrompt = buildVolumeUserPrompt(baseContext, vi, totalV);
        const raw = await generateOneVolume(settings, userPrompt);
        sections[vi] = sanitizeSovereignProposalOutput(raw);
      } catch (error) {
        const partialSections: string[] = [];
        for (let k = 0; k < vi; k++) {
          const s = sections[k];
          if (s) partialSections.push(s);
        }
        const message = error instanceof Error ? error.message : "Unexpected generation failure.";
        const status = isNonRetryableGenerationError(message) ? 429 : 502;
        const code = status === 429 ? "RATE_LIMITED" : "BAD_RESPONSE";
        return jsonError(status, {
          error: "فشل التوليد. راجع تفاصيل الخطأ أدناه أو تحقق من الشبكة وإعدادات المشروع ثم أعد المحاولة.",
          code,
          details: message,
          failedSection: vi,
          partialSections,
        });
      }
    }

    const fullDocument = sections
      .map((s) => s ?? "")
      .filter((s) => s.length > 0)
      .join(VOLUME_SEPARATOR);

    return new Response(fullDocument, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        Pragma: "no-cache",
        Expires: "0",
        "x-mudrik-volumes": String(totalV),
        "x-mudrik-protocol": protocolHeader,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected generation failure.";
    return jsonError(502, {
      error: "فشل التوليد. راجع تفاصيل الخطأ أدناه أو تحقق من الشبكة وإعدادات المشروع ثم أعد المحاولة.",
      code: "BAD_RESPONSE",
      details: message,
      failedSection: startIdx,
      partialSections: [] as string[],
    });
  }
}
