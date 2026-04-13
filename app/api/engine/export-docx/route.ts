import { NextResponse } from "next/server";
import { API_ERROR_UNEXPECTED_AR, logApiError } from "@/lib/api-errors";
import { renderPlainTechnicalProposalDocx } from "@/lib/proposal-docx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** حد أقصى لحجم النص (~12MB) لتفادي استهلاك الذاكرة المفرط */
const MAX_BODY_CHARS = 12 * 1024 * 1024;

function safeFilenameBase(name: string): string {
  const t = name.trim().slice(0, 120);
  if (!t) return "mudrik-proposal";
  return t.replace(/[<>:"/\\|?*]/g, "_").replace(/\s+/g, " ");
}

export async function POST(request: Request) {
  try {
    let body: { title?: unknown; body?: unknown };
    try {
      body = (await request.json()) as { title?: unknown; body?: unknown };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const rawBody = typeof body.body === "string" ? body.body : "";
    if (!rawBody.trim()) {
      return NextResponse.json({ error: "حقل body مطلوب ويجب ألا يكون فارغاً." }, { status: 400 });
    }
    if (rawBody.length > MAX_BODY_CHARS) {
      return NextResponse.json(
        { error: "حجم النص يتجاوز الحد المسموح. قلّل المحتوى أو قسّمه يدوياً." },
        { status: 413 },
      );
    }

    const title_ar =
      typeof body.title === "string" && body.title.trim() !== ""
        ? body.title.trim()
        : "عرض فني — مُدرك";

    const buffer = renderPlainTechnicalProposalDocx({ title_ar, body: rawBody });
    const base = safeFilenameBase(title_ar);
    const filename = `${base}-${Date.now()}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    logApiError("engine/export-docx", e);
    return NextResponse.json({ error: API_ERROR_UNEXPECTED_AR }, { status: 500 });
  }
}
