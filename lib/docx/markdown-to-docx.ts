/**
 * @project MUDRIK - AI Tender Consultant
 * @author Al-Baraa | البراء
 * @created April 2026
 * @status Stable Version 1.0
 * @copyright (c) 2026 All Rights Reserved
 * @legal_notice This source code and all its algorithms are the sole property of Al-Baraa.
 * Any unauthorized copying, modification, or distribution is strictly prohibited.
 * مشروع مُدْرِك - مستشار المنافسات الذكي
 * حقوق الملكية محفوظة (ج) ٢٠٢٦ - المؤلف: البراء
 *
 * Markdown → DOCX pipeline.
 *
 *   1. `marked.lexer(markdown)`  → strongly-typed AST (no regex hand-rolling).
 *   2. `tokensToDocxChildren`    → iterative mapper emitting docx Paragraph/Table nodes.
 *   3. `buildProposalDocument`   → wraps the body in a cover page + footer w/ page numbers.
 *
 * RTL correctness (the Arabic bidi bug-fix):
 *
 *   - Every Paragraph sets `bidirectional: true`.
 *   - Every TextRun sets `rightToLeft: true` (the docx-js prop that emits `<w:rtl/>`
 *     inside the run properties — this is what keeps numbers, brackets, percent signs
 *     and Latin tokens from flipping inside an Arabic line).
 *   - Every Table sets `visuallyRightToLeft: true` so column order mirrors for RTL
 *     reading direction.
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
  type IBorderOptions,
  type IParagraphOptions,
  type IRunOptions,
  type ISectionOptions,
  type ITableBordersOptions,
} from "docx";
import { marked, type Token, type Tokens } from "marked";

// ---------------------------------------------------------------------------
//  Typography contract
// ---------------------------------------------------------------------------

/**
 * "Traditional Arabic" is the primary font for this formal Saudi-government
 * proposal pipeline.
 *
 * Font-slot layout:
 *   - `cs` (complex script): Traditional Arabic — the authoritative Arabic
 *     render slot used by Word's Arabic/RTL shaper for all Arabic glyphs.
 *   - `ascii` / `hAnsi`: Traditional Arabic — keeps Latin abbreviations,
 *     numbers, and standard-references (SBC 201, ISO 9001, etc.) in the same
 *     typeface family for visual consistency.
 *   - `eastAsia`: Traditional Arabic — unused in Arabic text but set to avoid
 *     Word substituting a CJK fallback on bilingual machines.
 *
 * Availability: ships with every modern Arabic-locale Windows/macOS install
 * and every version of Microsoft Office.
 */
const ARABIC_FONT = {
  ascii: "Traditional Arabic",
  hAnsi: "Traditional Arabic",
  eastAsia: "Traditional Arabic",
  cs: "Traditional Arabic",
} as const;

/**
 * Half-points (hp). 1pt = 2hp.
 *
 * Body 14pt / Headings 20-24pt as specified:
 *   H1 24pt, H2 22pt, H3 20pt, H4 18pt, H5 16pt, H6 14pt.
 *
 * The cover-page title is 32pt to read at-a-glance from across a desk.
 */
const SIZE_BODY = 28;         // 14pt
const SIZE_H1   = 48;         // 24pt — top of heading range
const SIZE_H2   = 44;         // 22pt
const SIZE_H3   = 40;         // 20pt — bottom of heading range
const SIZE_H4   = 36;         // 18pt
const SIZE_H5   = 32;         // 16pt
const SIZE_H6   = 28;         // 14pt  (same as body — rarely used)
const SIZE_COVER_TITLE    = 64;  // 32pt
const SIZE_COVER_SUBTITLE = 40;  // 20pt
const SIZE_COVER_META     = 28;  // 14pt

const BULLET_REF = "mudrik-bullets";
const NUMBER_REF = "mudrik-numbers";

const TABLE_BORDER: IBorderOptions = {
  style: BorderStyle.SINGLE,
  size: 6, // 0.75pt — borders are expressed in eighths of a point.
  color: "003334",
};

const TABLE_BORDERS: ITableBordersOptions = {
  top: TABLE_BORDER,
  bottom: TABLE_BORDER,
  left: TABLE_BORDER,
  right: TABLE_BORDER,
  insideHorizontal: TABLE_BORDER,
  insideVertical: TABLE_BORDER,
};

// ---------------------------------------------------------------------------
//  Inline style propagation
// ---------------------------------------------------------------------------

type InlineStyle = {
  bold?: boolean;
  italics?: boolean;
  strike?: boolean;
  code?: boolean;
  size?: number;
  color?: string;
  underline?: boolean;
};

function makeRun(text: string, style: InlineStyle = {}): TextRun {
  const size = style.size ?? SIZE_BODY;
  const runOpts: IRunOptions = {
    text,
    font: ARABIC_FONT,
    size,
    // The Arabic RTL guard — emits <w:rtl/> inside <w:rPr/>. Without it,
    // numbers / brackets flip visually inside Arabic lines.
    rightToLeft: true,
    bold: style.bold ?? false,
    boldComplexScript: style.bold ?? false,
    italics: style.italics ?? false,
    italicsComplexScript: style.italics ?? false,
    strike: style.strike ?? false,
    color: style.color,
    underline: style.underline ? { type: "single" } : undefined,
  };
  if (style.code) {
    return new TextRun({
      ...runOpts,
      font: {
        ascii: "Consolas",
        hAnsi: "Consolas",
        eastAsia: "Consolas",
        cs: "Sakkal Majalla",
      },
      shading: { type: "clear", color: "auto", fill: "F0F4F4" },
    });
  }
  return new TextRun(runOpts);
}

/**
 * Walks the inline token stream (emphasis, strong, code-spans, links, images,
 * line-breaks, plain text) and flattens it into a list of TextRun objects that
 * share the caller's ambient style.
 */
function renderInline(tokens: readonly Token[] | undefined, base: InlineStyle = {}): TextRun[] {
  if (!tokens || tokens.length === 0) return [];
  const runs: TextRun[] = [];

  for (const raw of tokens) {
    const t = raw as Token;
    switch (t.type) {
      case "text": {
        const textTok = t as Tokens.Text;
        if (textTok.tokens && textTok.tokens.length > 0) {
          runs.push(...renderInline(textTok.tokens, base));
        } else {
          runs.push(makeRun(decodeEntities(textTok.text), base));
        }
        break;
      }
      case "escape": {
        runs.push(makeRun((t as Tokens.Escape).text, base));
        break;
      }
      case "strong": {
        runs.push(...renderInline((t as Tokens.Strong).tokens, { ...base, bold: true }));
        break;
      }
      case "em": {
        runs.push(...renderInline((t as Tokens.Em).tokens, { ...base, italics: true }));
        break;
      }
      case "del": {
        runs.push(...renderInline((t as Tokens.Del).tokens, { ...base, strike: true }));
        break;
      }
      case "codespan": {
        runs.push(makeRun(decodeEntities((t as Tokens.Codespan).text), { ...base, code: true }));
        break;
      }
      case "link": {
        const link = t as Tokens.Link;
        // Flatten as styled underlined blue run — we do not emit a hyperlink
        // relationship to keep the parser self-contained & deterministic.
        runs.push(
          ...renderInline(link.tokens, { ...base, color: "0563C1", underline: true }),
        );
        break;
      }
      case "image": {
        // Inline images are rendered as "[alt]" placeholders — embedding real
        // image binaries would require async IO which is out of scope here.
        const img = t as Tokens.Image;
        runs.push(makeRun(`[${img.text || img.href}]`, { ...base, italics: true }));
        break;
      }
      case "br": {
        runs.push(new TextRun({ break: 1, rightToLeft: true, font: ARABIC_FONT }));
        break;
      }
      case "html": {
        const htmlText = (t as Tokens.HTML).text.replace(/<[^>]+>/g, "");
        if (htmlText.trim().length > 0) runs.push(makeRun(decodeEntities(htmlText), base));
        break;
      }
      default: {
        // Generic fallback: dump whatever `text` / `raw` is present so no
        // content is silently dropped.
        const generic = t as Tokens.Generic;
        if (Array.isArray(generic.tokens) && generic.tokens.length > 0) {
          runs.push(...renderInline(generic.tokens, base));
        } else if (typeof generic.text === "string") {
          runs.push(makeRun(decodeEntities(generic.text), base));
        } else if (typeof generic.raw === "string") {
          runs.push(makeRun(decodeEntities(generic.raw), base));
        }
      }
    }
  }

  return runs;
}

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// ---------------------------------------------------------------------------
//  Block-level mapping
// ---------------------------------------------------------------------------

/** Ambient paragraph defaults applied to every block we emit. */
const RTL_PARAGRAPH_DEFAULTS: IParagraphOptions = {
  bidirectional: true,
  alignment: AlignmentType.JUSTIFIED,
  spacing: { before: 80, after: 120, line: 360 },
};

function paragraphFromRuns(
  runs: TextRun[],
  overrides: Partial<IParagraphOptions> = {},
): Paragraph {
  return new Paragraph({
    ...RTL_PARAGRAPH_DEFAULTS,
    ...overrides,
    children: runs.length > 0 ? runs : [makeRun("")],
  });
}

function headingLevelForDepth(depth: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  switch (depth) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    case 4:
      return HeadingLevel.HEADING_4;
    case 5:
      return HeadingLevel.HEADING_5;
    default:
      return HeadingLevel.HEADING_6;
  }
}

function headingSizeForDepth(depth: number): number {
  switch (depth) {
    case 1:
      return SIZE_H1;
    case 2:
      return SIZE_H2;
    case 3:
      return SIZE_H3;
    case 4:
      return SIZE_H4;
    case 5:
      return SIZE_H5;
    default:
      return SIZE_H6;
  }
}

type ListCursor = { numberInstance: number };

function buildListParagraphs(
  list: Tokens.List,
  cursor: ListCursor,
  level: number,
  blocks: (Paragraph | Table)[],
): void {
  const isOrdered = list.ordered;
  const reference = isOrdered ? NUMBER_REF : BULLET_REF;
  const instance = isOrdered ? ++cursor.numberInstance : 0;

  for (const item of list.items) {
    let emittedFirst = false;

    for (const child of item.tokens) {
      const c = child as Token;

      if (c.type === "list") {
        // Nested list — recurse with a bumped level. docx list levels are
        // 0-indexed and we defined four of them at the document level below.
        buildListParagraphs(c as Tokens.List, cursor, Math.min(level + 1, 3), blocks);
        continue;
      }

      if (c.type === "text" || c.type === "paragraph") {
        const inlineTokens =
          (c as Tokens.Text | Tokens.Paragraph).tokens ??
          ([{ type: "text", raw: (c as Tokens.Text).text, text: (c as Tokens.Text).text }] as Token[]);
        const runs = renderInline(inlineTokens, { size: SIZE_BODY });

        // Prefix the first paragraph of a task-list item with a checkbox glyph.
        if (!emittedFirst && item.task) {
          runs.unshift(makeRun(item.checked ? "☑ " : "☐ ", { size: SIZE_BODY, bold: true }));
        }

        blocks.push(
          paragraphFromRuns(runs, {
            numbering: { reference, level, instance },
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 40, after: 60, line: 340 },
          }),
        );
        emittedFirst = true;
        continue;
      }

      // Anything else inside a list item (blockquote, code block, table, …):
      // render as a normal block — docx keeps them flowing under the bullet.
      tokensToDocxChildren([c], blocks, cursor);
    }

    if (!emittedFirst) {
      blocks.push(
        paragraphFromRuns([makeRun(item.text ?? "")], {
          numbering: { reference, level, instance },
        }),
      );
    }
  }
}

function buildTable(token: Tokens.Table): Table {
  const columnCount = token.header.length;

  const mapAlignment = (
    align: Tokens.Table["align"][number],
  ): (typeof AlignmentType)[keyof typeof AlignmentType] => {
    switch (align) {
      case "center":
        return AlignmentType.CENTER;
      case "left":
        return AlignmentType.LEFT;
      case "right":
        return AlignmentType.RIGHT;
      default:
        return AlignmentType.RIGHT; // RTL-friendly default
    }
  };

  const headerRow = new TableRow({
    tableHeader: true,
    children: token.header.map((cell, idx) => {
      const align = mapAlignment(token.align[idx] ?? null);
      return new TableCell({
        shading: { type: "clear", color: "auto", fill: "003334" },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        children: [
          paragraphFromRuns(
            renderInline(cell.tokens, { bold: true, color: "FFFFFF", size: SIZE_BODY }),
            { alignment: align, spacing: { before: 20, after: 20 } },
          ),
        ],
      });
    }),
  });

  const bodyRows = token.rows.map(
    (row, rowIdx) =>
      new TableRow({
        children: row.map((cell, idx) => {
          const align = mapAlignment(token.align[idx] ?? null);
          return new TableCell({
            /*
             * Alternating row shading — even rows (0, 2, 4…) keep the default
             * white background; odd rows get a very light emerald tint (#EEF5F5)
             * so long tables are easier to read without the eye losing track of
             * the current line.
             */
            shading: rowIdx % 2 === 1
              ? { type: "clear", color: "auto", fill: "EEF5F5" }
              : undefined,
            margins: { top: 110, bottom: 110, left: 140, right: 140 },
            children: [
              paragraphFromRuns(renderInline(cell.tokens, { size: SIZE_BODY }), {
                alignment: align,
                spacing: { before: 20, after: 20 },
              }),
            ],
          });
        }),
      }),
  );

  return new Table({
    rows: [headerRow, ...bodyRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    visuallyRightToLeft: true, // mirror column order for RTL reading
    layout: TableLayoutType.AUTOFIT,
    columnWidths: Array.from({ length: columnCount }, () => Math.floor(9000 / columnCount)),
  });
}

function tokensToDocxChildren(
  tokens: readonly Token[],
  out: (Paragraph | Table)[],
  cursor: ListCursor,
): void {
  for (const raw of tokens) {
    const t = raw as Token;
    switch (t.type) {
      case "heading": {
        const h = t as Tokens.Heading;
        /*
         * Graduated gold rule under main headers — spec: "subtle gold-colored
         * horizontal rule under the main document headers."
         *
         * H1: 12 eighths (1.5pt) — prominent, marks major sections.
         * H2: 8 eighths  (1.0pt) — standard rule.
         * H3: 4 eighths  (0.5pt) — hairline, keeps depth without noise.
         * H4+: no rule — sub-sub headings stay visually quiet.
         *
         * Colour #D4AF37 (royal gold) is used at full opacity because DOCX
         * borders cannot express alpha; on a white page 1pt gold is inherently
         * subtle — no transparency needed.
         */
        const goldRuleSize = h.depth === 1 ? 12 : h.depth === 2 ? 8 : h.depth === 3 ? 4 : 0;
        out.push(
          paragraphFromRuns(
            renderInline(h.tokens, { bold: true, size: headingSizeForDepth(h.depth) }),
            {
              heading: headingLevelForDepth(h.depth),
              alignment: AlignmentType.RIGHT,
              spacing: {
                before: h.depth <= 2 ? 320 : 240,
                after:  h.depth <= 2 ? 160 : 100,
                line: 380,
              },
              keepNext: true,
              ...(goldRuleSize > 0 && {
                border: {
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: goldRuleSize,
                    color: "D4AF37",
                    space: h.depth === 1 ? 6 : 4,
                  },
                },
              }),
            },
          ),
        );
        break;
      }
      case "paragraph": {
        const p = t as Tokens.Paragraph;
        out.push(paragraphFromRuns(renderInline(p.tokens, { size: SIZE_BODY })));
        break;
      }
      case "blockquote": {
        const bq = t as Tokens.Blockquote;
        // A blockquote in markdown may wrap paragraphs, lists, etc. We render
        // each inner paragraph with an indent + green right-side border, and
        // delegate non-paragraph tokens (nested lists / tables) recursively.
        for (const inner of bq.tokens) {
          if ((inner as Token).type === "paragraph") {
            const para = inner as Tokens.Paragraph;
            out.push(
              new Paragraph({
                ...RTL_PARAGRAPH_DEFAULTS,
                indent: { start: 720, end: 360 },
                border: {
                  right: { style: BorderStyle.SINGLE, size: 18, color: "006A67", space: 8 },
                },
                children: renderInline(para.tokens, {
                  italics: true,
                  color: "003334",
                  size: SIZE_BODY,
                }),
              }),
            );
          } else {
            tokensToDocxChildren([inner], out, cursor);
          }
        }
        break;
      }
      case "list": {
        buildListParagraphs(t as Tokens.List, cursor, 0, out);
        break;
      }
      case "table": {
        out.push(buildTable(t as Tokens.Table));
        // Add a spacer paragraph after tables for breathing room.
        out.push(paragraphFromRuns([makeRun("")], { spacing: { before: 60, after: 60 } }));
        break;
      }
      case "code": {
        const code = t as Tokens.Code;
        const lines = code.text.split(/\r?\n/);
        for (const line of lines) {
          out.push(
            new Paragraph({
              ...RTL_PARAGRAPH_DEFAULTS,
              alignment: AlignmentType.LEFT,
              bidirectional: false,
              shading: { type: "clear", color: "auto", fill: "F0F4F4" },
              spacing: { before: 0, after: 0, line: 320 },
              children: [
                new TextRun({
                  text: line.length > 0 ? line : " ",
                  font: {
                    ascii: "Consolas",
                    hAnsi: "Consolas",
                    eastAsia: "Consolas",
                    cs: "Consolas",
                  },
                  size: 22,
                  rightToLeft: false,
                }),
              ],
            }),
          );
        }
        out.push(paragraphFromRuns([makeRun("")]));
        break;
      }
      case "hr": {
        out.push(
          new Paragraph({
            ...RTL_PARAGRAPH_DEFAULTS,
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "003334", space: 1 },
            },
            children: [makeRun("")],
          }),
        );
        break;
      }
      case "space": {
        // marked emits "space" tokens for blank lines — keep them for vertical rhythm.
        out.push(paragraphFromRuns([makeRun("")], { spacing: { before: 40, after: 40 } }));
        break;
      }
      case "html": {
        const htmlText = (t as Tokens.HTML).text.replace(/<[^>]+>/g, "").trim();
        if (htmlText.length > 0) {
          out.push(paragraphFromRuns([makeRun(decodeEntities(htmlText))]));
        }
        break;
      }
      case "def": {
        // Link references: emit nothing in the rendered document.
        break;
      }
      default: {
        // Generic fallback so custom/extension tokens still surface their text.
        const generic = t as Tokens.Generic;
        if (Array.isArray(generic.tokens) && generic.tokens.length > 0) {
          tokensToDocxChildren(generic.tokens, out, cursor);
        } else if (typeof generic.text === "string" && generic.text.trim().length > 0) {
          out.push(paragraphFromRuns([makeRun(decodeEntities(generic.text))]));
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
//  Document assembly — cover page, body, footer w/ page numbers
// ---------------------------------------------------------------------------

export type BuildDocxOptions = {
  /** The raw markdown emitted by the upstream LLM / engine. */
  markdown: string;
  /** Project / tender title shown on the cover. */
  title?: string;
  /** Cover subtitle (e.g. entity name or competition ID). */
  subtitle?: string;
  /** Submitting organization. Defaults to Mudrik AI. */
  preparedBy?: string;
  /** Submission date. Defaults to today in ar-SA calendar. */
  date?: Date;
};

function formatArabicDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "full",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function buildCoverPage(options: BuildDocxOptions): Paragraph[] {
  const title     = options.title?.trim()      || "العرض الفني الرسمي";
  const subtitle  = options.subtitle?.trim()   || "منصة اعتماد — المملكة العربية السعودية";
  const preparedBy = options.preparedBy?.trim() || "أُعِدّ بواسطة منصة مناقصة للذكاء الاصطناعي";
  const date       = formatArabicDate(options.date ?? new Date());

  /**
   * Helper — centered paragraph.
   * `spacingAfter` is in twentieths-of-a-point (so 200 ≈ 10pt space below).
   */
  const center = (runs: TextRun[], spacingAfter = 200): Paragraph =>
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: spacingAfter, line: 400 },
      children: runs,
    });

  /**
   * Horizontal rule helper.
   * `style` / `size` / `color` follow OOXML border semantics.
   */
  const hRule = (
    size: number,
    color: string,
    style: (typeof BorderStyle)[keyof typeof BorderStyle] = BorderStyle.SINGLE,
    spacingBefore = 160,
    spacingAfter  = 240,
  ) =>
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      spacing: { before: spacingBefore, after: spacingAfter },
      border: { bottom: { style, size, color, space: 4 } },
      children: [makeRun(" ", { size: SIZE_BODY })],
    });

  return [
    // ── Top breathing room ────────────────────────────────────────────────
    center([makeRun(" ")], 480),
    center([makeRun(" ")], 240),

    // ── Crown / Authority banner ──────────────────────────────────────────
    center(
      [makeRun("بسم الله الرحمن الرحيم", { size: SIZE_COVER_META, color: "003334", italics: true })],
      160,
    ),
    center(
      [makeRun("المملكة العربية السعودية", { bold: true, size: SIZE_COVER_SUBTITLE, color: "003334" })],
      60,
    ),
    center(
      [makeRun("Kingdom of Saudi Arabia", { size: 24, color: "006A67", italics: true })],
      60,
    ),
    center(
      [makeRun("Official Government Procurement Proposal — عرض فني رسمي", {
        size: 22, color: "006A67", italics: true,
      })],
      0,
    ),

    // ── Top gold rule (DOUBLE, 1.5pt) ─────────────────────────────────────
    hRule(12, "D4AF37", BorderStyle.DOUBLE, 200, 360),

    // ── Project title ─────────────────────────────────────────────────────
    center(
      [makeRun(title, { bold: true, size: SIZE_COVER_TITLE, color: "003334" })],
      180,
    ),

    // ── Entity / competition subtitle ─────────────────────────────────────
    center(
      [makeRun(subtitle, { size: SIZE_COVER_SUBTITLE, color: "006A67" })],
      0,
    ),

    // ── Bottom gold rule (SINGLE, 1pt) ────────────────────────────────────
    hRule(8, "D4AF37", BorderStyle.SINGLE, 240, 320),

    // ── Meta grid ─────────────────────────────────────────────────────────
    //   Two-column look achieved with tab stops is not portable; instead we
    //   emit labelled rows — cleanest approach for RTL Arabic formal docs.
    center(
      [
        makeRun("الجهة المُقدِّمة:  ", { bold: true, size: SIZE_COVER_META, color: "003334" }),
        makeRun(preparedBy,           { size: SIZE_COVER_META, color: "003334" }),
      ],
      120,
    ),
    center(
      [
        makeRun("تاريخ الإصدار:  ", { bold: true, size: SIZE_COVER_META, color: "003334" }),
        makeRun(date,                 { size: SIZE_COVER_META, color: "003334" }),
      ],
      120,
    ),
    center(
      [
        makeRun("نوع الوثيقة:  ", { bold: true, size: SIZE_COVER_META, color: "003334" }),
        makeRun("عرض فني — للرفع على منصة اعتماد",
          { size: SIZE_COVER_META, color: "003334" }),
      ],
      120,
    ),
    center(
      [
        makeRun("درجة السرية:  ", { bold: true, size: SIZE_COVER_META, color: "003334" }),
        makeRun("سري — للاستخدام الداخلي فقط",
          { size: SIZE_COVER_META, color: "9B1C1C" }),
      ],
      0,
    ),

    // ── Thin emerald rule ─────────────────────────────────────────────────
    hRule(6, "006A67", BorderStyle.SINGLE, 240, 200),

    // ── Branding footnote ─────────────────────────────────────────────────
    center(
      [
        makeRun("هذه الوثيقة مُعدَّة آليًا بواسطة منصة ", {
          italics: true, size: 20, color: "006A67",
        }),
        makeRun("مناقصة", { bold: true, size: 20, color: "003334" }),
        makeRun(" للذكاء الاصطناعي — Mudrik AI Platform", {
          italics: true, size: 20, color: "006A67",
        }),
      ],
      0,
    ),

    // ── Force body onto its own page ──────────────────────────────────────
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      pageBreakBefore: true,
      children: [makeRun(" ", { size: SIZE_BODY })],
    }),
  ];
}

function buildFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: "006A67", space: 6 },
        },
        children: [
          new TextRun({
            text: "صفحة ",
            font: ARABIC_FONT,
            size: 22,
            rightToLeft: true,
            color: "006A67",
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: ARABIC_FONT,
            size: 22,
            rightToLeft: true,
            color: "003334",
            bold: true,
          }),
          new TextRun({
            text: " من ",
            font: ARABIC_FONT,
            size: 22,
            rightToLeft: true,
            color: "006A67",
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            font: ARABIC_FONT,
            size: 22,
            rightToLeft: true,
            color: "003334",
            bold: true,
          }),
          new TextRun({
            text: "   —   Munakasa · مناقصة",
            font: ARABIC_FONT,
            size: 20,
            rightToLeft: true,
            color: "006A67",
            italics: true,
          }),
        ],
      }),
    ],
  });
}

/**
 * Public entry point — converts a markdown string to an in-memory docx
 * Document object. Call `Packer.toBuffer(doc)` to serialise.
 */
export function buildProposalDocument(options: BuildDocxOptions): Document {
  const tokens = marked.lexer(options.markdown ?? "");
  const body: (Paragraph | Table)[] = [];
  const cursor: ListCursor = { numberInstance: 0 };
  tokensToDocxChildren(tokens, body, cursor);

  // Guard against empty input — we still want a valid document.
  if (body.length === 0) {
    body.push(paragraphFromRuns([makeRun("— لا يوجد محتوى —")]));
  }

  const cover = buildCoverPage(options);
  const section: ISectionOptions = {
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          right: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1),
        },
        size: { width: 11906, height: 16838 }, // A4 in twips
      },
    },
    footers: { default: buildFooter() },
    children: [...cover, ...body],
  };

  return new Document({
    creator: "Mudrik AI",
    title: options.title ?? "Mudrik Official Proposal",
    description: "Auto-generated Arabic proposal — Mudrik platform.",
    styles: {
      default: {
        document: {
          run: { font: ARABIC_FONT, size: SIZE_BODY, rightToLeft: true },
          // NOTE: `bidirectional` lives on each Paragraph (via RTL_PARAGRAPH_DEFAULTS),
          // not on the style defaults — `IParagraphStylePropertiesOptions` doesn't
          // accept it. We keep alignment/line-height here as the document-wide baseline.
          paragraph: { alignment: AlignmentType.JUSTIFIED },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: BULLET_REF,
          levels: [0, 1, 2, 3].map((lvl) => ({
            level: lvl,
            format: LevelFormat.BULLET,
            text: ["•", "◦", "▪", "▫"][lvl] ?? "•",
            alignment: AlignmentType.RIGHT,
            style: {
              run: { font: ARABIC_FONT, size: SIZE_BODY },
              paragraph: {
                indent: { start: 720 * (lvl + 1), hanging: 360 },
              },
            },
          })),
        },
        {
          reference: NUMBER_REF,
          levels: [0, 1, 2, 3].map((lvl) => ({
            level: lvl,
            format: LevelFormat.DECIMAL,
            text: `%${lvl + 1}.`,
            alignment: AlignmentType.RIGHT,
            style: {
              run: { font: ARABIC_FONT, size: SIZE_BODY, bold: true },
              paragraph: {
                indent: { start: 720 * (lvl + 1), hanging: 420 },
              },
            },
          })),
        },
      ],
    },
    sections: [section],
  });
}

/** Convenience wrapper: markdown → docx Buffer. */
export async function markdownToDocxBuffer(options: BuildDocxOptions): Promise<Buffer> {
  const doc = buildProposalDocument(options);
  return Packer.toBuffer(doc);
}
