import { NextResponse } from "next/server";
import { extractComplianceFromPdf } from "@/lib/compliance_engine/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PDF_MIME = "application/pdf";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "الطلب يجب أن يكون multipart/form-data ويتضمن الملف في الحقل rfp." },
        { status: 400 },
      );
    }

    const form = await request.formData();
    const file = form.get("rfp");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "الملف مطلوب في الحقل rfp." }, { status: 400 });
    }

    const reportedMime = (file.type || "").trim().toLowerCase();
    const isPdfByName = file.name.toLowerCase().endsWith(".pdf");
    if (reportedMime !== PDF_MIME && !isPdfByName) {
      return NextResponse.json({ error: "يدعم compliance_engine ملفات PDF فقط حالياً." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extractComplianceFromPdf(buffer);

    return NextResponse.json({
      ok: true,
      filename: file.name,
      model_provider: result.provider,
      source_char_count: result.source_char_count,
      extracted: result.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع في compliance_engine.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
