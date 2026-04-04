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

const APPROX_CHARS_PER_TOKEN = 3.2;

export function estimateTokens(text: string): number {
  if (!text.trim()) return 0;
  return Math.max(1, Math.ceil(text.length / APPROX_CHARS_PER_TOKEN));
}

function splitOversizedParagraph(paragraph: string, maxChars: number): string[] {
  const parts: string[] = [];
  let start = 0;
  while (start < paragraph.length) {
    parts.push(paragraph.slice(start, start + maxChars));
    start += maxChars;
  }
  return parts;
}

export type TextChunk = {
  content: string;
  tokenEstimate: number;
  chunkIndex: number;
};

export function chunkTextByTokens(
  fullText: string,
  maxTokens: number = 512,
  overlapTokens: number = 48
): TextChunk[] {
  const normalized = fullText.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim();
  if (!normalized) return [];

  const maxChars = Math.max(200, Math.floor(maxTokens * APPROX_CHARS_PER_TOKEN));
  const overlapChars = Math.floor(overlapTokens * APPROX_CHARS_PER_TOKEN);

  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const segments: { content: string; tokenEstimate: number }[] = [];
  let buffer = "";

  const flushBuffer = () => {
    const trimmed = buffer.trim();
    if (!trimmed) {
      buffer = "";
      return;
    }
    if (estimateTokens(trimmed) <= maxTokens) {
      segments.push({ content: trimmed, tokenEstimate: estimateTokens(trimmed) });
      buffer = "";
      return;
    }
    let sliceStart = 0;
    while (sliceStart < trimmed.length) {
      let end = Math.min(trimmed.length, sliceStart + maxChars);
      let piece = trimmed.slice(sliceStart, end);
      while (estimateTokens(piece) > maxTokens && end > sliceStart + 80) {
        end -= 40;
        piece = trimmed.slice(sliceStart, end);
      }
      segments.push({ content: piece.trim(), tokenEstimate: estimateTokens(piece) });
      sliceStart = end - overlapChars;
      if (sliceStart < 0) sliceStart = 0;
      if (end >= trimmed.length) break;
    }
    buffer = "";
  };

  for (const para of paragraphs) {
    const pieces =
      para.length > maxChars ? splitOversizedParagraph(para, maxChars) : [para];
    for (const piece of pieces) {
      const candidate = buffer ? `${buffer}\n\n${piece}` : piece;
      if (estimateTokens(candidate) <= maxTokens) {
        buffer = candidate;
      } else {
        flushBuffer();
        buffer = piece;
      }
    }
  }
  flushBuffer();

  return segments.map((c, i) => ({
    content: c.content,
    tokenEstimate: c.tokenEstimate,
    chunkIndex: i,
  }));
}
