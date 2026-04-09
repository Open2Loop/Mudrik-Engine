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
import { normalizeProposalJson, proposalToMatrixText } from "@/lib/proposal-schema";
import { renderProposalDocx } from "@/lib/proposal-docx";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const body = (await request.json()) as { proposal?: unknown };
    if (!body.proposal) {
      return NextResponse.json({ error: "حقل proposal مطلوب." }, { status: 400 });
    }

    let proposal;
    try {
      proposal = normalizeProposalJson(body.proposal);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "هيكل غير صالح";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const buffer = renderProposalDocx({
      title_ar: proposal.title_ar,
      executive_summary: proposal.executive_summary,
      technical_approach: proposal.technical_approach,
      timeline: proposal.timeline,
      pricing_notes: proposal.pricing_notes,
      compliance_matrix_ar: proposalToMatrixText(proposal),
    });

    const filename = `mudrik-proposal-${Date.now()}.docx`;
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    logApiError("proposal/build", e);
    return NextResponse.json({ error: API_ERROR_UNEXPECTED_AR }, { status: 500 });
  }
}
