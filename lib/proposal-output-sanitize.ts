/**
 * Post-processing for sovereign technical proposal output: plain clean text for Word / government use.
 */

const ROBOTIC_LINE_PATTERNS: RegExp[] = [
  /^(بالتأكيد|بكل\s*سرور|يسعدني|أنا\s*هنا\s*للمساعدة|كمساعد\s*ذكاء\s*اصطناعي|بصفتي\s*(نموذجاً\s*)?للذكاء\s*الاصطناعي|بصفتي\s*ذكاء\s*اصطناعي)[،,:.\s]*/i,
  /^(Of\s+course|Certainly|As\s+an\s+AI|This\s+section\s+will\s+cover|I\s+hope\s+this\s+helps|In\s+summary|It\s+is\s+worth\s+noting)[،,.\s]*/i,
  /^(يتناول\s*هذا\s*القسم|في\s*هذا\s*القسم\s*سنتناول|أتمنى\s*أن\s*ينال|في\s*الخلاصة|من\s*الجدير\s*بالذكر|باختصار\s*[:،])[،,:.\s]*/i,
];

/** Drop whole paragraphs that are typical English brochure templates (model slippage). */
const ENGLISH_BOILERPLATE_PARAGRAPH: RegExp[] = [
  /^This document provides\b/i,
  /^This section (outlines|describes|covers|will)\b/i,
  /^The document will be used by stakeholders\b/i,
  /^It serves as (an )?essential guide\b/i,
  /^Note:\s*This is (just )?an example/i,
  /^You will need to fill in specific details\b/i,
  /^\d+\.\s*Executive Summary\b/i,
];

/** Arabic stock phrases repeated by weak models — drop short paragraphs that are only this line. */
const ARABIC_STOCK_ONLY_PARA =
  /^(تُساهم هذه الأعمال في خلق بيئة عمل فعالة ومريحة|تُتيح للعملاء والمهنيين التفاعل مع الأنظمة التقنيات بسهولة)[.…\s]*$/u;

/** Collapse repeated blank lines; trim edges. */
function normalizeWhitespace(t: string): string {
  return t
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Remove markdown-style markers and decorative fences from plain-text output. */
function stripFormattingNoise(line: string): string {
  let s = line;
  s = s.replace(/^#{1,6}\s*/, "");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/`+/g, "");
  s = s.replace(/\[(.*?)\]\([^)]*\)/g, "$1");
  s = s.replace(/[*_]{2,}/g, "");
  return s;
}

/** Remove accidental CoT / outline leaks at the start of the volume text. */
function stripLeadingCotLeak(text: string): string {
  const lines = text.split("\n");
  while (lines.length > 0) {
    const first = (lines[0] ?? "").trim();
    if (!first) {
      lines.shift();
      continue;
    }
    if (
      /^(التفكير\s*الداخلي|خطة\s*العمل|CoT\b|Chain[-\s]?of[-\s]?Thought)/i.test(first) ||
      /^(سأفكّر|سأخطط|أولاً\s*[:،])/i.test(first)
    ) {
      lines.shift();
      continue;
    }
    break;
  }
  return lines.join("\n").trim();
}

function stripBoilerplateParagraphs(text: string): string {
  const paras = text.split(/\n\n+/);
  const kept: string[] = [];
  for (const p of paras) {
    const first = p.trim().split(/\n/)[0]?.trim() ?? "";
    if (!first) continue;
    if (ARABIC_STOCK_ONLY_PARA.test(first) && p.trim().length < 400) {
      continue;
    }
    const isEnglishTemplate = ENGLISH_BOILERPLATE_PARAGRAPH.some((re) => re.test(first));
    if (isEnglishTemplate) {
      continue;
    }
    if (/^Note:\s*/i.test(first) && /example|fill in|will need/i.test(p)) {
      continue;
    }
    kept.push(p);
  }
  return kept.join("\n\n").trim();
}

function stripLeadingRoboticParagraphs(text: string): string {
  let t = text;
  const paras = t.split(/\n\n+/);
  while (paras.length > 0) {
    const first = paras[0]?.trim() ?? "";
    if (!first) {
      paras.shift();
      continue;
    }
    const firstLine = first.split("\n")[0]?.trim() ?? "";
    const isRobotic = ROBOTIC_LINE_PATTERNS.some((re) => re.test(firstLine));
    if (isRobotic && first.length < 800) {
      paras.shift();
      t = paras.join("\n\n");
      continue;
    }
    break;
  }
  return t;
}

/**
 * Sanitize model output: no markdown noise, no common AI disclaimers, engineering-ready plain text.
 */
export function sanitizeSovereignProposalOutput(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  let t = raw.replace(/\r\n/g, "\n");
  const fenced = t.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  if (fenced?.[1] !== undefined) {
    t = fenced[1].trim();
  }
  const lines = t.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (/^---+$/.test(trimmed) || /^={3,}$/.test(trimmed)) {
      out.push("");
      continue;
    }
    out.push(stripFormattingNoise(trimmed));
  }
  t = out.join("\n");
  t = t.replace(/`/g, "");
  t = t.replace(/\*+/g, "");
  t = normalizeWhitespace(t);
  t = stripLeadingCotLeak(t);
  t = stripLeadingRoboticParagraphs(t);
  t = stripBoilerplateParagraphs(t);
  return normalizeWhitespace(t);
}
