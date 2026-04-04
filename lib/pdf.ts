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

import pdf from "pdf-parse";

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const result = await pdf(buffer);
  const text = typeof result.text === "string" ? result.text : "";
  return text.replace(/\u0000/g, "").trim();
}
