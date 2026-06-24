import { completeAuxiliaryGenerationWithRetry } from "@/lib/ai-gateway";
import { isByokKeyMissingError } from "@/lib/byok";
import { assertAuxiliaryGenerationKey, resolveEngineUserSettings } from "@/lib/engine-user-settings";
import { NextResponse } from "next/server";
import type { UserModelSettings } from "@/lib/model-gateway";
import { METADATA_SOURCE_TEXT_CAP } from "@/lib/engine-metadata";
import { parseSidePanelArray } from "@/lib/side-panel-json";
import type { WbsItem } from "@/lib/engine-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const revalidate = 0;

const SYSTEM_PROMPT = Object.freeze(
  [
    "أنت 'مناقصة'، الخبير التقني والمالي الأول في صياغة العروض الفنية للمناقصات والمنافسات الحكومية.",
    "عند طلب جدول التنفيذ/خارطة الطريق: أنت تُعدّ **مصفوفة زمنية / Roadmap** من المراحل، لا لوحة حالات مهام (Kanban).",
    "يُمنع صراحةً استعمال كلمات مثل: Pending, In Progress, قيد الانتظار, جارٍ التنفيذ كأعمدة حالة — استبدلها **بمعالم زمنية** واضحة (أشهر، أسابيع، مراحل تسليم).",
    "لغتك قانونية، دقيقة، عربية فصيحة، وجاهزة للاعتماد الرسمي.",
  ].join(" "),
);

interface GenerateWbsBody {
  proposalText?: string;
  executionDuration?: string;
}

function jsonError(status: number, payload: Record<string, unknown>) {
  return NextResponse.json(payload, { status });
}

function clientFail500(message: string) {
  return jsonError(500, { success: false, error: message || "Internal API Error" });
}

async function getUserSettings(): Promise<UserModelSettings> {
  const { settings } = await resolveEngineUserSettings();
  assertAuxiliaryGenerationKey(settings);
  return settings;
}

export async function POST(request: Request) {
  try {
    let body: GenerateWbsBody;
    try {
      body = (await request.json()) as GenerateWbsBody;
    } catch {
      return jsonError(400, { error: "Invalid JSON body." });
    }

    const rawProposal = typeof body.proposalText === "string" ? body.proposalText.trim() : "";
    if (!rawProposal) {
      return jsonError(400, { error: "حقل proposalText مطلوب." });
    }
    const proposalText = rawProposal.slice(0, METADATA_SOURCE_TEXT_CAP);

    const executionDuration =
      typeof body.executionDuration === "string" && body.executionDuration.trim()
        ? body.executionDuration.trim()
        : "غير محدد";

    const userPrompt = [
      "أنشئ **خارطة طريق تنفيذية (Execution Roadmap)** — مصفوفة زمنية من المراحل — من النص التالي، بالترتيب الزمني من البداية إلى التسليم.",
      "هذا ليس سجل حالات: **لا** تطلب ولا تُخرِج حقلاً يسمى state/status بنِسَب مثل pending أو active أو done، ولا تستخدم كلمات مثل 'قيد الانتظار' أو 'جارٍ التنفيذ' كوصف رئيسي.",
      "لكل بند وضِع **إطاراً زمنياً نسبياً** في الحقل `timeframe` (أو `duration_tag` كبديل) بصيغ عربية واضحة، مثل:",
      "«الشهر الأول - الشهر الثالث»، «الأسبوع 1-4»، «الربع الثاني من المشروع»، «مرحلة التسليم والاختبار».",
      "يمكنك دمج اسم المرحلة داخل `timeframe` عند الحاجة، مثال: «[ الشهر الأول - التأسيس ]» أو الإبقاء على `phase` منفصلاً و`timeframe` يصف النافذة الزمنية فقط.",
      "أعد فقط JSON صالحاً دون أي نص إضافي.",
      "الشكل المطلوب: [{\"id\":1,\"phase\":\"...\",\"detail\":\"...\",\"timeframe\":\"...\"}]  (ويمكنك إضافة \"duration_tag\" إن رغبت بنفس قيمة الإطار الزمني).",
      `المدة الإجمالية أو المرجعية للمشروع (كما وردت أو كما تستنتج): ${executionDuration}`,
      "اجعل المراحل منطقية ومتتابعة ومناسبة لعروض المنافسات في المملكة.",
      "",
      proposalText,
    ].join("\n");

    const settings = await getUserSettings();
    const modelNameForLog =
      settings.generationEngine === "openai" || settings.aiProvider === "openai"
        ? String(settings.chatModel ?? "openai")
        : process.env.GEMINI_METADATA_MODEL?.trim() || "gemini-2.5-flash";
    // eslint-disable-next-line no-console
    console.log("Calling AI Model with:", modelNameForLog);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 55_000);

    let rawText: string;
    try {
      rawText = await Promise.race([
        completeAuxiliaryGenerationWithRetry(settings, SYSTEM_PROMPT, userPrompt),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error("UPSTREAM_FAILED"));
          });
        }),
      ]);
    } catch (e) {
      if (e instanceof Error && (e.message === "UPSTREAM_FAILED" || e.name === "AbortError")) {
        // eslint-disable-next-line no-console
        console.log("AI Response Status:", 504, "(timeout/abort)");
        return clientFail500("UPSTREAM_FAILED");
      }
      if (e instanceof Error) {
        // eslint-disable-next-line no-console
        console.error("[generate-wbs] upstream/LLM error", e);
        // eslint-disable-next-line no-console
        console.log("AI Response Status:", "error");
        return clientFail500(e.message || "UPSTREAM_FAILED");
      }
      return clientFail500("UPSTREAM_FAILED");
    } finally {
      clearTimeout(timeoutId);
    }

    // eslint-disable-next-line no-console
    console.log("AI Response Status:", 200);

    if (typeof rawText !== "string" || !rawText) {
      return clientFail500("UPSTREAM_FAILED");
    }

    let wbs: WbsItem[];
    try {
      wbs = parseSidePanelArray<WbsItem>(rawText);
    } catch (parseErr) {
      // eslint-disable-next-line no-console
      console.error("[generate-wbs] JSON parse — rawText preview:", rawText.slice(0, 4_000), parseErr);
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      return clientFail500(msg);
    }

    return NextResponse.json(
      { success: true, data: wbs, wbs },
      { status: 200 },
    );
  } catch (err) {
    if (isByokKeyMissingError(err)) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status },
      );
    }
    const m = err instanceof Error ? err.message : String(err);
    console.error("[generate-wbs]", m);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : m || "Internal API Error" },
      { status: 500 },
    );
  }
}
