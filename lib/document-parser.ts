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

import { logApiError } from "@/lib/api-errors";
import pdf from "pdf-parse";
import mammoth from "mammoth";

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MSWORD_MIME = "application/msword";

/** Infer MIME from filename when the browser sends empty or generic types. */
export function inferMimeFromFilename(filename: string): string | null {
  const lower = filename.trim().toLowerCase();
  if (lower.endsWith(".pdf")) return PDF_MIME;
  if (lower.endsWith(".docx")) return DOCX_MIME;
  if (lower.endsWith(".doc")) return MSWORD_MIME;
  return null;
}

/** Normalize OCR/PDF noise for cleaner downstream RAG and generation. */
export function normalizeExtractedText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t\f\v]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

/**
 * Extracts text from a PDF buffer.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const result = await pdf(buffer);
    const text = typeof result.text === "string" ? result.text : "";
    return normalizeExtractedText(text);
  } catch (error) {
    logApiError("document-parser/pdf", error);
    throw new Error("فشل استخراج النص من ملف PDF. قد يكون الملف محمياً أو تالفاً.");
  }
}

/**
 * Extracts text from a DOCX buffer.
 */
export async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = typeof result.value === "string" ? result.value : "";
    return normalizeExtractedText(text);
  } catch (error) {
    logApiError("document-parser/docx", error);
    throw new Error("فشل استخراج النص من ملف Word. يرجى التأكد من أن الملف بصيغة .docx وغير تالف.");
  }
}

/**
 * Extracts text from a document buffer based on its type.
 * If `mimeType` is empty or generic, pass `filename` so the extension can disambiguate PDF vs DOCX.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  filename?: string
): Promise<string> {
  let mime = (mimeType || "").trim().toLowerCase();
  if (!mime || mime === "application/octet-stream" || mime === "") {
    const inferred = filename ? inferMimeFromFilename(filename) : null;
    if (inferred) mime = inferred.toLowerCase();
  }

  if (mime === PDF_MIME.toLowerCase()) {
    return extractTextFromPdfBuffer(buffer);
  }
  if (mime === DOCX_MIME.toLowerCase()) {
    return extractTextFromDocxBuffer(buffer);
  }
  if (mime === MSWORD_MIME.toLowerCase()) {
    throw new Error(
      "صيغة .doc القديمة غير مدعومة للاستخراج الآمن. احفظ الملف كـ .docx أو PDF وأعد المحاولة.",
    );
  }
  throw new Error(`نوع الملف غير مدعوم: ${mimeType || mime || "(غير معروف)"}`);
}
