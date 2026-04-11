import {
  ENGINE_FULL_SYSTEM_PROMPT_AR,
  GatewayError,
  generateSovereignText,
  generateSovereignStream
} from "@/lib/ai-gateway";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;
export const revalidate = 0;
const RETRY_DELAY_MS = 700;
const RFP_CAP = 24_000;

function buildConsultantPrompt(
  projectName: string,
  ownerEntity: string,
  executionDuration: string,
  rfpText?: string,
): string {
  const lines = [
    "صِغ مسودة عرض فني عربية دقيقة. عند وجود «نص كراسة الشروط» أدناه، اجعله المرجع الأساسي للالتزام بالشروط والمواعيد والنطاق.",
    "",
    `اسم المشروع: ${projectName}`,
    `الجهة المالكة: ${ownerEntity}`,
    `مدة التنفيذ: ${executionDuration}`,
  ];
  const rfp = typeof rfpText === "string" ? rfpText.trim() : "";
  if (rfp) {
    lines.push("", "=== نص كراسة الشروط المستخرج (مرجع) ===", rfp.slice(0, RFP_CAP));
  }
  return lines.join("\n");
}

export async function POST(request: Request) {
  let body: { projectName?: string; ownerEntity?: string; executionDuration?: string; rfpText?: string };
  try {
    body = (await request.json()) as {
      projectName?: string;
      ownerEntity?: string;
      executionDuration?: string;
      rfpText?: string;
    };
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const projectName = typeof body.projectName === "string" && body.projectName.trim() !== "" ? body.projectName.trim() : "غير محدد";
  const ownerEntity = typeof body.ownerEntity === "string" && body.ownerEntity.trim() !== "" ? body.ownerEntity.trim() : "غير محدد";
  const executionDuration = typeof body.executionDuration === "string" && body.executionDuration.trim() !== "" ? body.executionDuration.trim() : "غير محدد";
  const rfpText = typeof body.rfpText === "string" ? body.rfpText.trim() : "";
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    /*
    if (userErr || !user) {
      return Response.json({ error: "غير مصرح" }, { status: 401 });
    }
    */

    const prompt = buildConsultantPrompt(projectName, ownerEntity, executionDuration, rfpText);
    
    let stream: ReadableStream;
    try {
      stream = await generateSovereignStream(ENGINE_FULL_SYSTEM_PROMPT_AR, prompt);
    } catch (firstError) {
      if (firstError instanceof GatewayError) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        stream = await generateSovereignStream(ENGINE_FULL_SYSTEM_PROMPT_AR, prompt);
      } else {
        throw firstError;
      }
    }

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    if (error instanceof GatewayError) {
      const userFacing =
        error.code === "MODEL_NOT_FOUND" || error.code === "CONNECTION_REFUSED"
          ? error.message
          : "Generation failed at model gateway.";
      return Response.json(
        {
          error: userFacing,
          code: error.code,
          details: error.details ?? error.message,
          status: error.status ?? 502,
        },
        { status: 502 },
      );
    }

    const message = error instanceof Error ? error.message : "Unexpected generation failure.";
    return Response.json(
      {
        error: "Generation request failed.",
        code: "BAD_RESPONSE",
        details: message,
      },
      { status: 502 },
    );
  }
}
