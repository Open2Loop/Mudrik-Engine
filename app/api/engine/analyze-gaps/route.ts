import { completeAuxiliaryGenerationWithRetry } from "@/lib/ai-gateway";
import { isByokKeyMissingError } from "@/lib/byok";
import { assertAuxiliaryGenerationKey, resolveEngineUserSettings } from "@/lib/engine-user-settings";
import { NextResponse } from "next/server";
import type { UserModelSettings } from "@/lib/model-gateway";
import { METADATA_SOURCE_TEXT_CAP } from "@/lib/engine-metadata";
import { parseSidePanelArray } from "@/lib/side-panel-json";
import type { GapItem } from "@/lib/engine-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Vercel Pro: 300s ceiling for long Gemini JSON extractions (align with estimate-boq / generate-wbs). */
export const maxDuration = 300;
export const revalidate = 0;

const SYSTEM_PROMPT = Object.freeze(
  "أنت 'مناقصة'، الخبير التقني والمالي الأول في صياغة العروض الفنية للمناقصات والمنافسات الحكومية. لغتك قانونية، دقيقة، خالية من الحشو، وجاهزة للاعتماد الرسمي. يجب أن تعتمد في صياغتك على المعايير التقنية الصارمة، الامتثال الأمني، والمصطلحات المعتمدة في المشتريات الحكومية.",
);

interface AnalyzeGapsBody {
  proposalText?: string;
  rfpText?: string;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function jsonError(status: number, payload: Record<string, unknown>) {
  return NextResponse.json(payload, { status });
}

async function getUserSettings(): Promise<UserModelSettings> {
  const { settings } = await resolveEngineUserSettings();
  assertAuxiliaryGenerationKey(settings);
  return settings;
}

export async function POST(request: Request) {
  try {
    let body: AnalyzeGapsBody;
    try {
      body = (await request.json()) as AnalyzeGapsBody;
    } catch {
      return jsonError(400, { error: "Invalid JSON body." });
    }

    const rawProposal = toText(body.proposalText);
    if (!rawProposal) {
      return jsonError(400, { error: "حقل proposalText مطلوب." });
    }
    const proposalText = rawProposal.slice(0, METADATA_SOURCE_TEXT_CAP);

    const rfpText = toText(body.rfpText);

    const userPrompt = [
      "استخرج فجوات الامتثال من النص التالي وأعد فقط JSON صالحاً دون أي نص إضافي.",
      "الشكل المطلوب: [{\"id\":1,\"text\":\"...\",\"severity\":\"critical|weak|covered\"}]",
      "اجعل القائمة مختصرة ومباشرة.",
      "",
      "النص الفني:",
      proposalText,
      rfpText ? "\nمرجع الكراسة:\n" + rfpText.slice(0, 4000) : "",
    ].join("\n");

    const settings = await getUserSettings();
    const modelNameForLog =
      settings.generationEngine === "openai" || settings.aiProvider === "openai"
        ? String(settings.chatModel ?? "openai")
        : process.env.GEMINI_METADATA_MODEL?.trim() || "gemini-2.5-flash";
    // eslint-disable-next-line no-console
    console.log("Calling AI Model with:", modelNameForLog);

    const raw = await completeAuxiliaryGenerationWithRetry(settings, SYSTEM_PROMPT, userPrompt);
    // eslint-disable-next-line no-console
    console.log("AI Response Status:", 200);

    let gaps: GapItem[];
    try {
      gaps = parseSidePanelArray<GapItem>(raw);
    } catch (parseErr) {
      // eslint-disable-next-line no-console
      console.error("[analyze-gaps] JSON parse — rawText preview:", raw.slice(0, 4_000), parseErr);
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      return jsonError(500, { success: false, error: msg || "JSON parse failed" });
    }

    return NextResponse.json(
      { success: true, data: gaps, gaps },
      { status: 200 },
    );
  } catch (error) {
    if (isByokKeyMissingError(error)) {
      return jsonError(error.status, { success: false, error: error.message, code: error.code });
    }
    const message = error instanceof Error ? error.message : "Internal API Error";
    // eslint-disable-next-line no-console
    console.error("GAPS API CRASH:", error);
    return jsonError(500, { success: false, error: message || "Internal API Error" });
  }
}
