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

/**
 * Extracts text from a PDF buffer.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const result = await pdf(buffer);
    const text = typeof result.text === "string" ? result.text : "";
    return text.replace(/\u0000/g, "").trim();
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
    return text.trim();
  } catch (error) {
    logApiError("document-parser/docx", error);
    throw new Error("فشل استخراج النص من ملف Word. يرجى التأكد من أن الملف بصيغة .docx وغير تالف.");
  }
}

/**
 * Extracts text from a document buffer based on its type.
 */
export async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractTextFromPdfBuffer(buffer);
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return extractTextFromDocxBuffer(buffer);
  } else {
    throw new Error(`نوع الملف غير مدعوم: ${mimeType}`);
  }
}
