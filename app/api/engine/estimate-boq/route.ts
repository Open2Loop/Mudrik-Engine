import { completeAuxiliaryGenerationWithRetry } from "@/lib/ai-gateway";
import { NextResponse } from "next/server";
import type { UserModelSettings } from "@/lib/model-gateway";
import { METADATA_SOURCE_TEXT_CAP } from "@/lib/engine-metadata";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchUserModelSettings } from "@/lib/user-settings";
import { parseSidePanelArray } from "@/lib/side-panel-json";
import type { BoqItem } from "@/lib/engine-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const revalidate = 0;

const SYSTEM_PROMPT = Object.freeze(
  [
    "أنت تعمل ضمن منصة 'مناقصة'، لكن دورك الأساسي هنا: كبير مساحي كميات ومهندس تكاليف (Senior Quantity Surveyor) يعمل في المملكة العربية السعودية،",
    "يقدّر جداول الكميات والتكاليف لعروض المنافسات الحكومية والقطاع الخاص بأسلوب احترافي يقنع العملاء المؤسسيين.",
    "لغتك عربية فصيحة تقنية، دقيقة، خالية من الحشو، وجاهزة للاعتماد؛ تلتزم بأرقام معقولة منطقياً وليست دعائية.",
  ].join(" "),
);

interface EstimateBoqBody {
  proposalText?: string;
}

function jsonError(status: number, payload: Record<string, unknown>) {
  return NextResponse.json(payload, { status });
}

async function getUserSettings(): Promise<UserModelSettings> {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (authData?.user?.id) return fetchUserModelSettings(supabase, authData.user.id);
  return {
    aiProvider: "gemini",
    generationEngine: "gemini",
    modelApiKey: process.env.OPENAI_API_KEY ?? null,
    geminiApiKey: process.env.GEMINI_API_KEY ?? null,
    embeddingModel: "text-embedding-3-small",
    chatModel: "gpt-4o-mini",
  };
}

export async function POST(request: Request) {
  try {
    let body: EstimateBoqBody;
    try {
      body = (await request.json()) as EstimateBoqBody;
    } catch {
      return jsonError(400, { error: "Invalid JSON body." });
    }

    const raw = typeof body.proposalText === "string" ? body.proposalText.trim() : "";
    if (!raw) {
      return jsonError(400, { error: "حقل proposalText مطلوب." });
    }
    const proposalText = raw.slice(0, METADATA_SOURCE_TEXT_CAP);

    const userPrompt = [
      "استخرج جدول كميات وتقدير تكاليف (BoQ) من النص الفني/العرض التالي، معتمداً على ما ورد في النص ومدى تعقيد المشروع.",
      "قواعد التقدير الإلزامية:",
      "— لا تستخدم أرقاماً عشوائية أو مبالغاً فلكية مُدورة دون مبرر (مثل 50,000,000 ر.س لحفر بسيط أو بند تافه).",
      "— اجعل التقدير مبنياً على أسعار سوق سعودي معقول لمبنى ذكي نموذجي من حوالي 5 طوابق، ما لم ينص نص الكراسة/العرض صراحة على نطاق مختلف.",
      "— وزّع التكاليف تفصيلياً (granular) على بُنى منفصلة ضمن JSON: مواد (Materials)، أيدي عاملة (Labor)، معدات (Equipment)،",
      "  ثم بند واضح لهامش ربحي إجمالي ≈ 15% على المجموع المباشر (أو يوضح أنه 15% هامش) ضمن family منطقية.",
      "— تأكد أن إجمالي تكلفة المشروع المقدّرة (مجموع البنود + الهامش كما اقتضت الصيغة) يبقى في نطاق منطقي لتجربة مبنى مماثل، غالباً بين 15 و 35 مليون ر.س",
      "  إذا تطابقت وثائق المشروع مع مبنى إنشائي/ذكي بهذا الحجم، مع تعديل النطاق إذا وردت في النص مبالغ أو مساحات أو درجات تعقيد مختلفة بشكل صريح.",
      "أعد فقط JSON صالحاً دون أي نص إضافي.",
      "الشكل المطلوب: [{\"id\":1,\"type\":\"Materials|Labor|Equipment|Overhead&Profit|Software|Human Resource|Infrastructure|Compliance|Other\",\"item\":\"وصف البند\",\"cost\":\"مبلغ بـ ر.س أو صيغة واضحة\"}]",
      "استخدم عدة بنود تفصيلية كافية لإقناع المُراجع المالي؛ اجعل حقل type يعكس التصنيف (مواد/عمالة/معدة/هامش/أو فئة الامتثال/برمجيات إن وُجدت).",
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

    const llmOut = await completeAuxiliaryGenerationWithRetry(settings, SYSTEM_PROMPT, userPrompt);
    // eslint-disable-next-line no-console
    console.log("AI Response Status:", 200);

    let boq: BoqItem[];
    try {
      boq = parseSidePanelArray<BoqItem>(llmOut);
    } catch (parseErr) {
      // eslint-disable-next-line no-console
      console.error("[estimate-boq] JSON parse — rawText preview:", llmOut.slice(0, 4_000), parseErr);
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      return jsonError(500, { success: false, error: msg || "JSON parse failed" });
    }

    return NextResponse.json(
      { success: true, data: boq, boq },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal API Error";
    // eslint-disable-next-line no-console
    console.error("BOQ API CRASH:", error);
    return jsonError(500, { success: false, error: message || "Internal API Error" });
  }
}
