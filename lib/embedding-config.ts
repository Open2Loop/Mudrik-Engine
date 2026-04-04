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

/**
 * Must match `vector(N)` in `document_chunks.embedding` and `match_document_chunks`.
 * Default 3072 aligns with Gemini embedding defaults; OpenAI embeddings should request the same `dimensions`.
 */
export const EMBEDDING_VECTOR_DIMENSIONS = parseInt(
  process.env.EMBEDDING_VECTOR_DIMENSIONS ??
    process.env.EMBEDDING_DIMENSIONS ??
    process.env.GEMINI_EMBEDDING_DIMENSIONS ??
    "3072",
  10
);

export function assertEmbeddingVector(values: number[], context: string): void {
  if (!Number.isFinite(EMBEDDING_VECTOR_DIMENSIONS) || EMBEDDING_VECTOR_DIMENSIONS < 1) {
    throw new Error("إعداد أبعاد المتجه غير صالح (EMBEDDING_VECTOR_DIMENSIONS).");
  }
  if (values.length !== EMBEDDING_VECTOR_DIMENSIONS) {
    throw new Error(
      `بعد المتجه ${values.length} لا يطابق قاعدة البيانات (${EMBEDDING_VECTOR_DIMENSIONS}). ${context}`
    );
  }
}
