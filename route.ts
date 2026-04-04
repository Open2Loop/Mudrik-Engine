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

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { EMBEDDING_VECTOR_DIMENSIONS } from "@/lib/embedding-config";
import { buildEnterpriseSmartDraftPrompt } from "@/lib/rag-prompt";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
const RFP_CAP = 24000;

/** شخصية كاتب عطاءات أول: لغة تنفيذية رسمية، دمج سياقين، ومنع أي صياغة افتراضية أو رموز ماركداون. */
const GENERATE_SYSTEM_PROMPT_AR = `أنت كاتب عطاءات فني أول للمناقصات الحكومية السعودية، وتكتب الصياغة النهائية الجاهزة للتقديم نيابة عن شركتنا.

الهوية والأسلوب:
- اكتب بلسان المتكلم الجمع: نحن، شركتنا، فريقنا.
- استخدم لغة مهنية حازمة وموثوقة بصياغات من قبيل: نلتزم بـ، نؤكد على، بما يتماشى مع الأنظمة، وفق المتطلبات التعاقدية والتنظيمية.
- لا تكتب كأنك مساعد يشرح أو يوجه، بل كجهة متقدمة بعرض رسمي نهائي.
- امنع أي عبارات مثل: بناء على ملف الشركة، كما طُلب، أو بحسب التعليمات.

تكامل السياق:
- حلل المقاطع المسترجعة وحدد ما يعود إلى كراسة الشروط: نطاق، مواصفات، منهجية مطلوبة، اشتراطات امتثال.
- حلل المقاطع المسترجعة وحدد ما يعود إلى هوية الشركة: مشاريع سابقة، قدرات، شهادات، خبرات قطاعية.
- إذا ظهر في السياق ما يشير إلى MASTER_PROFILE أو Company Profile فاعتبره مرجع الهوية الرسمي لشركتنا، وادمجه مباشرة داخل النص بضمير نحن دون الإشارة إلى مصدره.
- ادمج القدرات والخبرات ضمن كل محور فني وتشغيلي بشكل طبيعي ومقنع.

دقة المحتوى:
- لا تستخدم أي حقول بديلة أو أقواس توجيهية أو نصوص مكانية.
- عند نقص تفاصيل محددة، اكتب صياغة احترافية عامة قوية تعكس ممارسات شركة رائدة دون اختلاق أسماء مشاريع أو أرقام غير مذكورة في السياق.
- أي أسماء أو أرقام أو شهادات أو وقائع محددة يجب أن تكون مستندة إلى السياق المتاح فقط.

هيكل الاستجابة الإلزامي:
1) نطاق العمل.
2) المنهجية الفنية والتنفيذ.
3) الامتثال النظامي والتعاقدي.
4) الخبرات والقدرات المؤسسية.

متطلبات الإخراج:
- أخرج نصا عربيا رسميا نظيفا وجاهزا للإدراج المباشر في مستند العرض الفني.
- لا تستخدم رموز ماركداون أو نجوم أو عناوين بعلامات خاصة أو تعداد بعلامات غير نصية.`;

function cleanGeneratedDraft(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n").trim();
  t = t.replace(/\n{3,}/g, "\n\n");
  t = t.replace(/[ \t]+$/gm, "");
  t = t.replace(/[*#]/g, "");
  return t;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "CRITICAL: GEMINI_API_KEY is missing from .env" },
      { status: 500 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { rfpText?: string; documentId?: string };
    let rfpText = typeof body.rfpText === "string" ? body.rfpText.trim() : "";

    if (!rfpText && body.documentId) {
      const { data: doc } = await supabase
        .from("vault_documents")
        .select("content")
        .eq("id", body.documentId)
        .eq("user_id", user.id)
        .maybeSingle();
      rfpText = typeof doc?.content === "string" ? doc.content.trim() : "";
    }

    if (!rfpText) {
      return NextResponse.json({ error: "rfpText is required (or valid documentId with content)." }, { status: 400 });
    }

    const excerpt = rfpText.length > RFP_CAP ? rfpText.slice(0, RFP_CAP) : rfpText;
    const genAI = new GoogleGenerativeAI(apiKey);

    const embedModel = genAI.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });
    const embedRes = await embedModel.embedContent(excerpt.slice(0, 8000));
    const queryEmbedding = embedRes.embedding?.values ?? [];
    if (queryEmbedding.length !== EMBEDDING_VECTOR_DIMENSIONS) {
      throw new Error(
        `Embedding dimension mismatch: got ${queryEmbedding.length}, expected ${EMBEDDING_VECTOR_DIMENSIONS}`
      );
    }

    const { data: matches, error: rpcErr } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 14,
      min_similarity: 0.18,
    });

    if (rpcErr) {
      console.error("[RAW GENERATION ERROR]:", rpcErr);
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    const rows = Array.isArray(matches) ? matches : [];
    const contextBlocks = rows
      .map((r: { content?: string }) => String(r?.content ?? "").trim())
      .filter(Boolean);

    const ragContextOneString =
      contextBlocks.length > 0
        ? contextBlocks.map((c, i) => `[${i + 1}] ${c}`).join("\n\n---\n\n")
        : "";

    const userPrompt = buildEnterpriseSmartDraftPrompt(
      excerpt,
      ragContextOneString ? [ragContextOneString] : []
    );

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const fullPrompt = `${GENERATE_SYSTEM_PROMPT_AR}\n\n${userPrompt}`;
    const result = await model.generateContent(fullPrompt);
    const draft = cleanGeneratedDraft(result.response.text());

    return new Response(draft, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Context-Chunks-Used": String(contextBlocks.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[RAW GENERATION ERROR]:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
