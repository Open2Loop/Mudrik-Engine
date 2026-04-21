import pdf from "pdf-parse";

function normalizeText(text: string): string {
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

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const parsed = await pdf(buffer);
    const text = normalizeText(typeof parsed.text === "string" ? parsed.text : "");
    if (!text) {
      throw new Error("لم يتم استخراج أي نص من ملف PDF.");
    }
    return text;
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تحليل ملف PDF.";
    throw new Error(`فشل استخراج النص من ملف PDF: ${message}`);
  }
}
