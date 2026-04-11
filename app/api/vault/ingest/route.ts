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
import { chunkTextByTokens } from "@/lib/chunking";
import { extractTextFromBuffer } from "@/lib/document-parser";
import { embedTexts } from "@/lib/model-gateway";
import { fetchUserModelSettings } from "@/lib/user-settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertEmbeddingVector } from "@/lib/embedding-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EMBED_BATCH = 16;
const INSERT_BATCH = 40;

function formatVectorLiteral(values: number[]): string {
  assertEmbeddingVector(values, "قبل الإدراج في قاعدة البيانات.");
  return `[${values.join(",")}]`;
}

function safeFilename(name: unknown): string {
  const s = typeof name === "string" ? name.trim() : "";
  return s.length > 0 ? s : "document";
}

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

    const body = (await request.json()) as { documentId?: string };
    const documentId = body.documentId;
    if (!documentId) {
      return NextResponse.json({ error: "معرّف المستند مطلوب." }, { status: 400 });
    }

    const { data: docRow, error: docErr } = await supabase
      .from("vault_documents")
      .select("id, storage_path, user_id, filename, mime")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docErr || !docRow) {
      return NextResponse.json({ error: "المستند غير موجود." }, { status: 404 });
    }

    const row = docRow as {
      storage_path: string;
      filename?: string | null;
      mime?: string | null;
    };

    const storagePath = String(row.storage_path ?? "").trim();
    if (!storagePath) {
      await supabase
        .from("vault_documents")
        .update({ status: "failed", error_message: "مسار التخزين غير صالح" })
        .eq("id", documentId);
      return NextResponse.json({ error: "بيانات المستند غير مكتملة." }, { status: 400 });
    }

    await supabase
      .from("vault_documents")
      .update({ status: "processing", error_message: null })
      .eq("id", documentId);

    const settings = await fetchUserModelSettings(supabase, user.id);

    const { data: fileData, error: dlErr } = await supabase.storage.from("vault").download(storagePath);

    if (dlErr || !fileData) {
      const errMsg = dlErr?.message ?? "تعذر التحميل";
      await supabase
        .from("vault_documents")
        .update({ status: "failed", error_message: errMsg })
        .eq("id", documentId);
      return NextResponse.json({ error: "تعذر تحميل الملف من التخزين." }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const mime =
      typeof row.mime === "string" && row.mime.trim()
        ? row.mime.trim()
        : "application/pdf";

    const filenameHint =
      typeof row.filename === "string" && row.filename.trim() ? row.filename.trim() : undefined;

    let text: string;
    try {
      text = await extractTextFromBuffer(buffer, mime, filenameHint);
    } catch (e) {
      logApiError("vault/ingest/extract", e);
      const internal = e instanceof Error ? e.message : "extract failed";
      await supabase.from("vault_documents").update({ status: "failed", error_message: internal }).eq("id", documentId);
      return NextResponse.json(
        { error: "تعذر استخراج النص من الملف. تأكد من صيغة PDF أو DOCX." },
        { status: 422 },
      );
    }

    const trimmed = text.replace(/\u0000/g, "").trim();
    if (!trimmed) {
      await supabase
        .from("vault_documents")
        .update({ status: "failed", error_message: "لا يوجد نص قابل للاستخراج" })
        .eq("id", documentId);
      return NextResponse.json({ error: "لم يُستخرج أي نص من الملف." }, { status: 422 });
    }

    const contentUpdate: Record<string, unknown> = {
      status: "processing",
      error_message: null,
      content: trimmed,
      size_bytes: Number.isFinite(buffer.byteLength) ? buffer.byteLength : 0,
      filename: safeFilename(row.filename),
    };

    const { error: contentErr } = await supabase.from("vault_documents").update(contentUpdate).eq("id", documentId);
    if (contentErr) {
      const { error: contentErr2 } = await supabase
        .from("vault_documents")
        .update({
          status: "processing",
          error_message: null,
          size_bytes: contentUpdate.size_bytes,
          filename: contentUpdate.filename,
        })
        .eq("id", documentId);
      if (contentErr2) {
        logApiError("vault/ingest/document-update", contentErr2);
        return NextResponse.json(
          { error: "تعذر تحديث المستند في قاعدة البيانات." },
          { status: 500 },
        );
      }
    }

    await supabase.from("document_chunks").delete().eq("document_id", documentId);

    const chunks = chunkTextByTokens(trimmed, 512, 48).filter((c) => c.content.trim().length > 0);
    if (chunks.length === 0) {
      await supabase
        .from("vault_documents")
        .update({ status: "failed", error_message: "لا توجد مقاطع نصية صالحة للفهرسة" })
        .eq("id", documentId);
      return NextResponse.json({ error: "لم يُنتج التقسيم أي مقاطع." }, { status: 422 });
    }

    const vectors: number[][] = [];
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const slice = chunks.slice(i, i + EMBED_BATCH);
      const batchEmbeddings = await embedTexts(
        settings,
        slice.map((c) => c.content)
      );
      vectors.push(...batchEmbeddings);
    }

    if (vectors.length !== chunks.length) {
      const msg = "عدد المتجهات لا يطابق عدد المقاطع.";
      await supabase.from("vault_documents").update({ status: "failed", error_message: msg }).eq("id", documentId);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const rows = chunks.map((c, idx) => {
      const content = c.content.trim() || "\u200c";
      const emb = formatVectorLiteral(vectors[idx] ?? []);
      return {
        document_id: documentId,
        user_id: user.id,
        chunk_index: c.chunkIndex,
        content,
        token_estimate: c.tokenEstimate,
        embedding: emb,
      };
    });

    for (let i = 0; i < rows.length; i += INSERT_BATCH) {
      const batch = rows.slice(i, i + INSERT_BATCH);
      const { error: insErr } = await supabase.from("document_chunks").insert(batch);
      if (insErr) {
        logApiError("vault/ingest/chunk-insert", insErr);
        await supabase
          .from("vault_documents")
          .update({ status: "failed", error_message: insErr.message })
          .eq("id", documentId);
        return NextResponse.json(
          { error: "تعذر حفظ مقاطع المستند في قاعدة البيانات." },
          { status: 500 },
        );
      }
    }

    await supabase
      .from("vault_documents")
      .update({ status: "ready", error_message: null })
      .eq("id", documentId);

    return NextResponse.json({
      ok: true,
      documentId,
      chunks: chunks.length,
      filename: safeFilename(row.filename),
    });
  } catch (e) {
    logApiError("vault/ingest", e);
    return NextResponse.json({ error: API_ERROR_UNEXPECTED_AR }, { status: 500 });
  }
}
