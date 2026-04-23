/**
 * @project MUDRIK - AI Tender Consultant
 * @author Al-Baraa | البراء
 * @created April 2026
 * @status Stable Version 1.0
 * @copyright (c) 2026 All Rights Reserved
 * @legal_notice This source code and all its algorithms are the sole property of Al-Baraa.
 * Any unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * POST /api/export/word
 * ---------------------
 * Receives `{ proposalText: string }` in markdown form and streams back a
 * single .docx binary attachment built by `lib/docx/markdown-to-docx.ts`.
 *
 * Implementation notes:
 *   • The pipeline is: marked.lexer → token walker → docx Document → Packer.toBuffer.
 *   • Runtime MUST be `nodejs` because docx/Packer relies on Node streams + Buffer.
 *   • We serve the raw Uint8Array view of the Buffer so Next.js does not
 *     attempt to JSON-encode the payload.
 */

import { Packer } from "docx";
import { NextResponse } from "next/server";

import { buildProposalDocument } from "@/lib/docx/markdown-to-docx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface ExportRequestBody {
  proposalText?: string;
  title?: string;
  subtitle?: string;
  preparedBy?: string;
  date?: string;
  filename?: string;
}

function sanitizeFilename(raw: string | undefined): string {
  const fallback = "Mudrik_Official_Proposal.docx";
  if (!raw) return fallback;
  const cleaned = raw
    .replace(/[\u0000-\u001f"\\/:*?<>|]+/g, "")
    .trim();
  if (!cleaned) return fallback;
  return cleaned.toLowerCase().endsWith(".docx") ? cleaned : `${cleaned}.docx`;
}

export async function POST(request: Request) {
  let body: ExportRequestBody;
  try {
    body = (await request.json()) as ExportRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const markdown = typeof body.proposalText === "string" ? body.proposalText : "";
  if (!markdown.trim()) {
    return NextResponse.json(
      { error: "حقل proposalText مطلوب (نص Markdown غير فارغ)." },
      { status: 400 },
    );
  }

  const filename = sanitizeFilename(body.filename);

  try {
    const parsedDate = body.date ? new Date(body.date) : undefined;
    const doc = buildProposalDocument({
      markdown,
      title: body.title,
      subtitle: body.subtitle,
      preparedBy: body.preparedBy,
      date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : undefined,
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
        "X-Mudrik-Export": "word/docx",
      },
    });
  } catch (error) {
    console.error("[export/word] failed to build document", error);
    const details = error instanceof Error ? error.message : "Unexpected export failure.";
    return NextResponse.json(
      { error: "تعذر إنشاء ملف Word.", details },
      { status: 500 },
    );
  }
}
