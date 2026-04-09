/**
 * @project MUDRIK - AI Tender Consultant
 * @author Al-Baraa | البراء
 * @created March 2026
 * @status Stable Version 1.0
 * @copyright (c) 2026 All Rights Reserved
 * @legal_notice This source code and all its algorithms are the sole property of Al-Baraa.
 * Any unauthorized copying, modification, or distribution is strictly prohibited.
 * مشروع مُدْرِك - مستشار المنافسات الذكي
 * حقوق الملكية محفوظة (ج) ٢٠٢٦ - المؤلف: البراء
 */

import { NextResponse } from "next/server";
import { API_ERROR_UNEXPECTED_AR, logApiError } from "@/lib/api-errors";
import { extractTextFromBuffer } from "@/lib/document-parser";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "يتطلب إرسال multipart/form-data مع الحقل rfp" }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get("rfp");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "الملف مطلوب في الحقل rfp" }, { status: 400 });
    }

    const acceptedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (file.type && !acceptedTypes.includes(file.type)) {
      return NextResponse.json({ error: "يُقبل ملفات PDF أو DOCX فقط." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text: string;
    try {
      text = await extractTextFromBuffer(buffer, file.type || "application/pdf");
    } catch (e) {
      logApiError("engine/analyze/extract", e);
      return NextResponse.json(
        { error: "تعذر استخراج النص من الملف. تأكد من صحة PDF أو DOCX." },
        { status: 422 },
      );
    }

    const excerpt = text.trim();
    if (!excerpt) {
      return NextResponse.json({ error: "لم يُستخرج نص من الملف." }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      filename: file.name,
      charCount: excerpt.length,
      text: excerpt,
    });
  } catch (e) {
    logApiError("engine/analyze", e);
    return NextResponse.json({ error: API_ERROR_UNEXPECTED_AR }, { status: 500 });
  }
}
